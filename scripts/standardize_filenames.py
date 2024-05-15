#!/usr/bin/env python

import os
import shutil
import sys
import frontmatter

def rename_markdown_files(directory):
    # Iterate through each file in the directory
    for filename in os.listdir(directory):
        if filename.endswith(".md"):
            filepath = os.path.join(directory, filename)
            # Open the file and parse front matter
            with open(filepath, 'r') as file:
                post = frontmatter.load(file)
                # Check if id and category are in front matter
                if 'id' in post.keys() and 'category' in post.keys():
                    id_value = post['id']
                    category_value = post['category']
                    # Construct the new filename based on id and category
                    new_filename = f"{category_value}__{id_value}.md"
                    new_filepath = os.path.join(directory, new_filename)
                    # Rename the file
                    shutil.move(filepath, new_filepath)
                    print(f"Renamed '{filename}' to '{new_filename}'")
                else:
                    print(f"Could not find id and category attributes in '{filename}'")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python script.py <directory_path>")
        sys.exit(1)
    
    directory_path = sys.argv[1]
    if not os.path.isdir(directory_path):
        print("Error: Directory path does not exist.")
        sys.exit(1)
    
    rename_markdown_files(directory_path)
