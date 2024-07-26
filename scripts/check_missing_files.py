import os

# Define the base directory containing the language directories
base_dir = './../app/content/dtpr/elements'

# Get the list of language directories
language_dirs = [d for d in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, d))]

# Assume 'en' directory contains the reference files
reference_dir = os.path.join(base_dir, 'en')

# Get the list of files in the 'en' directory
reference_files = set(os.listdir(reference_dir))

# Function to check for missing files in a given directory
def check_missing_files(lang_dir):
    lang_path = os.path.join(base_dir, lang_dir)
    lang_files = set(os.listdir(lang_path))
    missing_files = reference_files - lang_files
    return missing_files

# Iterate through each language directory and check for missing files
missing_files_report = {}
for lang_dir in language_dirs:
    if lang_dir == 'en':
        continue
    missing_files = check_missing_files(lang_dir)
    if missing_files:
        missing_files_report[lang_dir] = missing_files

# Print the missing files for each language directory
for lang, missing_files in missing_files_report.items():
    print(f"Missing files in '{lang}' directory:")
    for file in missing_files:
        print(f"  {file}")

if not missing_files_report:
    print("No missing files found in any directory.")