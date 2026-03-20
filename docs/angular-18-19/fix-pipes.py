#!/usr/bin/env python3
"""
Add standalone: false to all Angular pipes that don't have it.
"""
import os
import re

def fix_pipe(file_path):
    """Add standalone: false to pipe if not present."""
    with open(file_path, 'r') as f:
        content = f.read()

    # Check if it's a pipe
    if '@Pipe({' not in content:
        return False

    # Check if standalone is already set
    if 'standalone:' in content:
        return False

    # Find the @Pipe decorator and add standalone: false
    pattern = r'(@Pipe\(\{)\s*\n\s*(name:)'
    replacement = r'\1\n  standalone: false,\n  \2'

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
                if fix_pipe(file_path):
                    count += 1
                    print(f"Fixed: {file_path}")

    print(f"\nTotal pipes fixed: {count}")

if __name__ == '__main__':
    main()
