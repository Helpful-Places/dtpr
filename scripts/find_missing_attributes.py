#!/usr/bin/env python

import os
import sys
import yaml

def read_frontmatter(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
        if content.startswith('---'):
            end_idx = content.find('---', 3)
            if end_idx != -1:
                frontmatter = content[3:end_idx].strip()
                return yaml.safe_load(frontmatter)
    return None

def check_markdown_files(directory):
    missing_files = []
    
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.md'):
                file_path = os.path.join(root, file)
                frontmatter = read_frontmatter(file_path)
                
                if frontmatter is None or 'id' not in frontmatter or 'description' not in frontmatter:
                    missing_files.append(file_path)
    
    return missing_files

def main(directory):
    missing_files = check_markdown_files(directory)
    if missing_files:
        print("Files missing 'id' or 'description' in the frontmatter:")
        for file in missing_files:
            print(file)
    else:
        print("All files have both 'id' and 'description' in the frontmatter.")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python check_frontmatter.py <directory>")
        sys.exit(1)

    directory = sys.argv[1]
    if not os.path.isdir(directory):
        print(f"The directory {directory} does not exist.")
        sys.exit(1)

    main(directory)
