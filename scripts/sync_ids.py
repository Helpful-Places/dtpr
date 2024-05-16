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
                return yaml.safe_load(frontmatter), content[end_idx + 3:].strip()
    return None, None

def write_frontmatter(file_path, frontmatter, content):
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write('---\n')
        yaml.dump(frontmatter, file, allow_unicode=True)
        file.write('---\n')
        file.write(content)

def synchronize_ids(source_dir, dest_dir):
    for root, _, files in os.walk(dest_dir):
        for file in files:
            if file.endswith('.md'):
                dest_file_path = os.path.join(root, file)
                source_file_path = os.path.join(source_dir, file)
                
                if os.path.exists(source_file_path):
                    dest_frontmatter, dest_content = read_frontmatter(dest_file_path)
                    source_frontmatter, _ = read_frontmatter(source_file_path)
                    
                    if dest_frontmatter is not None and 'id' not in dest_frontmatter:
                        if source_frontmatter and 'id' in source_frontmatter:
                            dest_frontmatter['id'] = source_frontmatter['id']
                            write_frontmatter(dest_file_path, dest_frontmatter, dest_content)
                            print(f"Updated 'id' in {dest_file_path}")

def main(source_dir, dest_dir):
    if not os.path.isdir(source_dir):
        print(f"The source directory {source_dir} does not exist.")
        sys.exit(1)
    if not os.path.isdir(dest_dir):
        print(f"The destination directory {dest_dir} does not exist.")
        sys.exit(1)

    synchronize_ids(source_dir, dest_dir)
    print("Synchronization complete.")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python sync_ids.py <source_directory> <destination_directory>")
        sys.exit(1)

    source_directory = sys.argv[1]
    destination_directory = sys.argv[2]
    
    main(source_directory, destination_directory)
