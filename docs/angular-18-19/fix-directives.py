#!/usr/bin/env python3
"""
Add standalone: false to all Angular directives that don't have it.
"""
import os
import re

def fix_directive(file_path):
    """Add standalone: false to directive if not present."""
    with open(file_path, 'r') as f:
        content = f.read()

    # Check if it's a directive
    if '@Directive({' not in content:
        return False

    # Check if standalone is already set
    if 'standalone:' in content:
        return False

    # Find the @Directive decorator and add standalone: false
    # Handle both single-line and multi-line formats
    pattern = r'(@Directive\(\{)\s*\n\s*(selector:)'
    replacement = r'\1\n  standalone: false,\n  \2'

    new_content = re.sub(pattern, replacement, content, count=1)

    # Also handle single-line @Directive({ selector: ... })
    if new_content == content:
        pattern = r'(@Directive\(\{ selector:)'
        replacement = r'\1\n  standalone: false,'
        new_content = re.sub(pattern, replacement, content, count=1)

    if new_content != content:
        with open(file_path, 'w') as f:
            f.write(new_content)
        return True
    return False

def main():
    """Process all TypeScript files in src/app."""
    count = 0
    for root, dirs, files in os.walk('src/app'):
        for file in files:
            if file.endswith('.ts') and not file.endswith('.spec.ts'):
                file_path = os.path.join(root, file)
                if fix_directive(file_path):
                    count += 1
                    print(f"Fixed: {file_path}")

    print(f"\nTotal directives fixed: {count}")

if __name__ == '__main__':
    main()
