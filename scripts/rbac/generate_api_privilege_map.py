#!/usr/bin/env python3
"""Generate the API x privilege x Web UI map.

The privilege column is parsed from the gns3-server source tree (FastAPI
route decorators and handler parameter defaults calling has_privilege /
has_privilege_on_websocket). The Web UI columns come from two places:

  1. an automatic scan of HttpController calls in this repository (which
     service calls which endpoint), and
  2. the curated page/action descriptions in ui_map.py.

Never hand-edit the generated Markdown/CSV: change the server source or
ui_map.py and regenerate.

Usage:
    python3 scripts/rbac/generate_api_privilege_map.py \
        --server ../gns3-server \
        --out docs/features/rbac

The server checkout must sit on the branch whose routes you want to map
(feat/rbac-out-of-the-box for the RBAC work).
"""

from __future__ import annotations

import argparse
import ast
import csv
import datetime as dt
import io
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

ROUTE_METHODS = {"get", "post", "put", "delete", "patch", "websocket"}
PRIVILEGE_CALLS = {"has_privilege", "has_privilege_on_websocket"}
AUTH_CALLS = {"get_current_active_user", "get_current_active_user_from_websocket"}

# Router prefixes as mounted in gns3server/api/routes/controller/__init__.py.
# Keep in sync with that file when routers are added or re-mounted.
ROUTER_PREFIXES = {
    "controller": "",
    "settings": "/settings",
    "users": "/access/users",
    "groups": "/access/groups",
    "roles": "/access/roles",
    "privileges": "/access/privileges",
    "acl": "/access/acl",
    "images": "/images",
    "templates": "/templates",
    "projects": "/projects",
    "nodes": "/projects/{project_id}/nodes",
    "links": "/projects/{project_id}/links",
    "drawings": "/projects/{project_id}/drawings",
    "symbols": "/symbols",
    "snapshots": "/projects/{project_id}/snapshots",
    "computes": "/computes",
    "appliances": "/appliances",
    "netmiko": "/netmiko",
    "pools": "/pools",
    "llm_model_configs": "/access",
    "copilot": "/copilot",
    "chat": "/copilot/projects/{project_id}/chat",
    "api_keys": "",
}

# Routers mounted with dependencies=[Depends(get_current_active_user)]:
# their endpoints are never public; a missing privilege means "login only".
AUTH_ONLY_ROUTERS = {"privileges", "computes", "llm_model_configs", "copilot", "chat", "api_keys"}

MODULE_LABELS = {
    "controller": "Controller (version / reload / notification WS)",
    "settings": "Server settings",
    "users": "Users (/access/users)",
    "groups": "Groups (/access/groups)",
    "roles": "Roles (/access/roles)",
    "privileges": "Privileges (/access/privileges)",
    "acl": "ACL (/access/acl)",
    "images": "Images",
    "templates": "Templates",
    "projects": "Projects",
    "nodes": "Nodes",
    "links": "Links",
    "drawings": "Drawings",
    "symbols": "Symbols",
    "snapshots": "Snapshots",
    "computes": "Computes",
    "appliances": "Appliances",
    "netmiko": "Netmiko",
    "pools": "Pools",
    "llm_model_configs": "LLM model configs (/access/.../llm-model-configs)",
    "copilot": "Copilot",
    "chat": "Copilot chat",
    "api_keys": "API keys",
}


@dataclass
class Endpoint:
    module: str
    source: str
    method: str
    path: str
    privileges: list[str]
    handler: str
    auth_only: bool
    docstring_privilege: str | None
    ui_page: str = ""
    ui_action: str = ""
    ui_notes: str = ""
    services: list[str] = field(default_factory=list)


def canon_path(path: str) -> str:
    """Collapse path parameters so server templates and TS template literals match."""
    path = re.sub(r"\$\{[^}]*\}", "{}", path)
    path = re.sub(r"\{[^}]*\}", "{}", path)
    path = path.split("?", 1)[0]
    path = re.sub(r"/+", "/", path)
    return path.rstrip("/") or "/"


def referenced_names(node: ast.AST) -> set[str]:
    """Every identifier referenced in a dependency expression.

    Dependencies appear as `Depends(get_current_active_user)` — the
    dependency itself is passed as a reference, not called — and as
    `Depends(has_privilege("X"))`, where the outer call is `Depends`.
    """
    names: set[str] = set()
    for sub in ast.walk(node):
        if isinstance(sub, ast.Name):
            names.add(sub.id)
        elif isinstance(sub, ast.Attribute):
            names.add(sub.attr)
    return names


def privilege_names(node: ast.AST) -> list[str]:
    """Collect has_privilege / has_privilege_on_websocket literals inside a node."""
    names: list[str] = []
    for sub in ast.walk(node):
        if not isinstance(sub, ast.Call):
            continue
        func = sub.func
        name = func.id if isinstance(func, ast.Name) else func.attr if isinstance(func, ast.Attribute) else None
        if name in PRIVILEGE_CALLS and sub.args and isinstance(sub.args[0], ast.Constant) and isinstance(sub.args[0].value, str):
            names.append(sub.args[0].value)
    return names


def needs_auth(call: ast.Call, function: ast.FunctionDef | ast.AsyncFunctionDef) -> bool:
    """True when the route itself depends on an authenticated user."""
    dependencies: list[ast.AST] = []
    for keyword in call.keywords:
        if keyword.arg == "dependencies":
            dependencies.append(keyword.value)
    dependencies.extend(function.args.defaults)
    dependencies.extend(d for d in function.args.kw_defaults if d is not None)
    return any(referenced_names(node) & AUTH_CALLS for node in dependencies)


def decorator_privileges(call: ast.Call) -> list[str]:
    names: list[str] = []
    for keyword in call.keywords:
        if keyword.arg == "dependencies":
            names.extend(privilege_names(keyword.value))
    return names


def module_router_prefix(tree: ast.Module) -> str:
    """Prefix declared on the module's own APIRouter(prefix=...) (e.g. api_keys)."""
    for node in tree.body:
        if (
            isinstance(node, ast.Assign)
            and len(node.targets) == 1
            and isinstance(node.targets[0], ast.Name)
            and node.targets[0].id == "router"
            and isinstance(node.value, ast.Call)
        ):
            for keyword in node.value.keywords:
                if keyword.arg == "prefix" and isinstance(keyword.value, ast.Constant):
                    return keyword.value.value
    return ""


def parse_routes(module: str, source: Path) -> list[Endpoint]:
    tree = ast.parse(source.read_text(encoding="utf-8"))
    # FastAPI applies the include_router prefix, then the router's own prefix.
    prefix = ROUTER_PREFIXES.get(module, "") + module_router_prefix(tree)
    endpoints: list[Endpoint] = []

    for node in ast.walk(tree):
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        for decorator in node.decorator_list:
            if not isinstance(decorator, ast.Call):
                continue
            func = decorator.func
            if not (isinstance(func, ast.Attribute) and func.attr in ROUTE_METHODS):
                continue

            route_path = ""
            if decorator.args and isinstance(decorator.args[0], ast.Constant) and isinstance(decorator.args[0].value, str):
                route_path = decorator.args[0].value

            privileges = decorator_privileges(decorator)
            # Handler parameter defaults such as
            # `current_user: User = Depends(has_privilege("LLMConfig.Audit"))`.
            for default in list(node.args.defaults) + [d for d in node.args.kw_defaults if d is not None]:
                privileges.extend(privilege_names(default))

            # De-duplicate while preserving order (decorator + param default may repeat).
            seen: set[str] = set()
            privileges = [p for p in privileges if not (p in seen or seen.add(p))]

            doc = ast.get_docstring(node) or ""
            match = re.search(r"Required privilege:\s*([A-Za-z0-9_.]+)", doc)
            endpoints.append(
                Endpoint(
                    module=module,
                    source=source.name,
                    method=decorator.func.attr.upper(),
                    path=(prefix + route_path) if route_path else prefix,
                    privileges=privileges,
                    handler=node.name,
                    auth_only=module in AUTH_ONLY_ROUTERS or needs_auth(decorator, node),
                    docstring_privilege=match.group(1) if match else None,
                )
            )
    return endpoints


HTTP_CALL = re.compile(r"httpController\s*\.\s*(get|post|put|delete)\s*(?:<[^;]{0,300}?>)?\s*\(", re.DOTALL)
LITERAL_START = re.compile(r"[`'\"]")


def service_calls(repo_root: Path) -> dict[str, list[str]]:
    """Map 'METHOD /canonical/path' -> ['services/x.service.ts:method', ...]."""
    calls: dict[str, list[str]] = {}
    for source in sorted((repo_root / "src" / "app").rglob("*.ts")):
        if source.name.endswith(".spec.ts"):
            continue
        text = source.read_text(encoding="utf-8")
        if "httpController" not in text:
            continue
        lines = text.splitlines()
        for match in HTTP_CALL.finditer(text):
            method = match.group(1).upper()
            rest = text[match.end() : match.end() + 600]
            literal = LITERAL_START.search(rest)
            if not literal:
                continue
            quote = literal.group(0)
            start = literal.end() - 1
            end = rest.find(quote, start + 1)
            if end == -1:
                continue
            path = rest[start + 1 : end]
            if not path.startswith("/"):
                continue
            line_no = text.count("\n", 0, match.start())
            owner = ""
            for index in range(line_no, max(line_no - 30, -1), -1):
                owner_match = re.match(
                    r"\s{2,8}(?:(?:public|private|protected|static|async|readonly)\s+)*([A-Za-z0-9_]+)\s*\(",
                    lines[index],
                )
                if owner_match and owner_match.group(1) not in {"if", "for", "while", "switch", "catch"}:
                    owner = owner_match.group(1)
                    break
            relative = source.relative_to(repo_root).as_posix()
            label = f"{relative}:{owner}" if owner else relative
            key = f"{method} {canon_path(path)}"
            bucket = calls.setdefault(key, [])
            if label not in bucket:
                bucket.append(label)
    return calls


def load_ui_map() -> dict[str, dict[str, str]]:
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    try:
        from ui_map import UI_MAP  # type: ignore
    except ImportError as error:
        raise SystemExit(f"ui_map.py not found next to this script: {error}")
    return UI_MAP


def git_info(server_root: Path) -> tuple[str, str]:
    try:
        branch = subprocess.run(
            ["git", "-C", str(server_root), "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
        commit = subprocess.run(
            ["git", "-C", str(server_root), "rev-parse", "--short", "HEAD"],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
        return branch, commit
    except Exception:
        return "unknown", "unknown"


def build(server_root: Path, repo_root: Path) -> list[Endpoint]:
    routes_dir = server_root / "gns3server" / "api" / "routes" / "controller"
    if not routes_dir.is_dir():
        raise SystemExit(f"controller routes not found under {routes_dir}")

    endpoints: list[Endpoint] = []
    for source in sorted(routes_dir.glob("*.py")):
        if source.name in {"__init__.py"}:
            continue
        module = source.stem
        if module not in ROUTER_PREFIXES:
            print(f"warning: module '{module}' has no prefix entry, assuming none", file=sys.stderr)
        endpoints.extend(parse_routes(module, source))

    calls = service_calls(repo_root)
    ui_map = load_ui_map()
    for endpoint in endpoints:
        key = f"{endpoint.method} {canon_path(endpoint.path)}"
        endpoint.services = calls.get(key, [])
        entry = ui_map.get(key)
        if isinstance(entry, dict):
            endpoint.ui_page = entry.get("page", "")
            endpoint.ui_action = entry.get("action", "")
            endpoint.ui_notes = entry.get("note", "")

    return sorted(endpoints, key=lambda e: (e.module, canon_path(e.path), e.method))


def privilege_label(endpoint: Endpoint) -> str:
    if endpoint.privileges:
        return ", ".join(endpoint.privileges)
    # No privilege declaration: distinguish "login required" from "no gate
    # declared here". The latter may still be protected elsewhere (network,
    # controller-internal), so do not call it public.
    return "— (login only)" if endpoint.auth_only else "— (no gate declared)"


def render_markdown(endpoints: list[Endpoint], branch: str, commit: str) -> str:
    now = dt.date.today().isoformat()
    with_privilege = [e for e in endpoints if e.privileges]
    auth_only = [e for e in endpoints if not e.privileges and e.auth_only]
    public = [e for e in endpoints if not e.privileges and not e.auth_only]
    websocket = [e for e in endpoints if e.method == "WEBSOCKET"]
    matched = [e for e in endpoints if e.services]
    curated = [e for e in endpoints if e.ui_page or e.ui_action]
    privileges = sorted({p for e in endpoints for p in e.privileges})

    out = io.StringIO()
    out.write("# GNS3 Controller API × Privilege × Web UI Map\n\n")
    out.write("> **Generated file — do not edit by hand.**\n>\n")
    out.write(f"> Source: `gns3-server` branch `{branch}` @ `{commit}`, generated {now}.\n>\n")
    out.write("> Regenerate with:\n>\n")
    out.write("> ```bash\n> python3 scripts/rbac/generate_api_privilege_map.py --server ../gns3-server\n> ```\n\n")
    out.write("The **Privilege** column is parsed from the server's `has_privilege(...)` / "
              "`has_privilege_on_websocket(...)` declarations (route decorator `dependencies` "
              "and handler parameter defaults). The **Web UI** columns are maintained in "
              "[`scripts/rbac/ui_map.py`](../../../scripts/rbac/ui_map.py); the **Service** "
              "column is auto-matched from `HttpController` calls in `src/app`.\n\n")
    out.write("All paths are relative to the controller API root (`/v3`).\n\n")

    out.write("## Summary\n\n")
    out.write(f"- Controller endpoints: **{len(endpoints)}** (WebSocket: {len(websocket)})\n")
    out.write(f"- With a privilege declaration: **{len(with_privilege)}**\n")
    out.write(f"- Login only (authenticated, no privilege): **{len(auth_only)}**\n")
    out.write(f"- No privilege gate declared: **{len(public)}** (may still be protected outside the decorator)\n")
    out.write(f"- Distinct privilege names: **{len(privileges)}**\n")
    out.write(f"- Endpoints called by a Web UI service: **{len(matched)}**\n")
    out.write(f"- Endpoints with a curated Web UI page/action: **{len(curated)}**\n\n")

    out.write("## Endpoints by module\n")
    modules = sorted({e.module for e in endpoints}, key=lambda m: (list(ROUTER_PREFIXES).index(m) if m in ROUTER_PREFIXES else 99, m))
    for module in modules:
        rows = [e for e in endpoints if e.module == module]
        out.write(f"\n### {MODULE_LABELS.get(module, module)} — `{rows[0].source}`\n\n")
        out.write("| Method | Path | Privilege | Web UI page | Web UI action | Service |\n")
        out.write("|--------|------|-----------|-------------|---------------|---------|\n")
        for endpoint in rows:
            service = "<br>".join(f"`{s}`" for s in endpoint.services) or "—"
            page = endpoint.ui_page or "—"
            action = endpoint.ui_action or ("(to be filled)" if endpoint.services else "—")
            note = f"<br>{endpoint.ui_notes}" if endpoint.ui_notes else ""
            out.write(
                f"| {endpoint.method} | `{endpoint.path or '/'}` | {privilege_label(endpoint)} | "
                f"{page} | {action}{note} | {service} |\n"
            )
    return out.getvalue()


def render_csv(endpoints: list[Endpoint]) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow([
        "Module", "Source file", "Method", "Path", "Privilege", "Handler",
        "Web UI page", "Web UI action", "Notes", "Web UI service (auto-matched)",
    ])
    for endpoint in endpoints:
        writer.writerow([
            endpoint.module,
            endpoint.source,
            endpoint.method,
            endpoint.path or "/",
            privilege_label(endpoint),
            endpoint.handler,
            endpoint.ui_page,
            endpoint.ui_action,
            endpoint.ui_notes,
            " | ".join(endpoint.services),
        ])
    return buffer.getvalue()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--server", default="../gns3-server", help="path to the gns3-server checkout")
    parser.add_argument("--out", default="docs/features/rbac", help="output directory")
    parser.add_argument("--repo", default=".", help="gns3-web-ui repository root")
    args = parser.parse_args()

    repo_root = Path(args.repo).resolve()
    server_root = Path(args.server).resolve()
    out_dir = (repo_root / args.out).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    endpoints = build(server_root, repo_root)
    branch, commit = git_info(server_root)

    markdown = render_markdown(endpoints, branch, commit)
    (out_dir / "api-privilege-map.md").write_text(markdown, encoding="utf-8")

    # UTF-8 BOM so Excel opens the Chinese columns correctly.
    (out_dir / "api-privilege-map.csv").write_text("﻿" + render_csv(endpoints), encoding="utf-8")

    matched = sum(1 for e in endpoints if e.services)
    curated = sum(1 for e in endpoints if e.ui_page or e.ui_action)
    print(f"{len(endpoints)} controller endpoints — {matched} called by a service, {curated} curated")
    print(f"server: {branch} @ {commit}")
    print(f"wrote {out_dir / 'api-privilege-map.md'}")
    print(f"wrote {out_dir / 'api-privilege-map.csv'}")


if __name__ == "__main__":
    main()
