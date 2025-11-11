#!/usr/bin/env python
"""Post-generation hook for markdown-chartpress cookiecutter template."""

import os
import shutil
import subprocess
from pathlib import Path


def remove_file(filepath):
    """Remove a file if it exists."""
    if os.path.isfile(filepath):
        os.remove(filepath)
        print(f"Removed: {filepath}")


def remove_dir(dirpath):
    """Remove a directory if it exists."""
    if os.path.isdir(dirpath):
        shutil.rmtree(dirpath)
        print(f"Removed: {dirpath}")


def rename_jinja_files():
    """Rename .jinja files to remove the extension."""
    for root, dirs, files in os.walk('.'):
        for filename in files:
            if filename.endswith('.jinja'):
                old_path = os.path.join(root, filename)
                new_path = os.path.join(root, filename[:-6])  # Remove .jinja
                os.rename(old_path, new_path)
                print(f"Renamed: {old_path} → {new_path}")


def main():
    """Clean up files based on cookiecutter choices."""

    publishing_platform = "{{ cookiecutter.publishing_platform }}"
    include_pdf = "{{ cookiecutter.include_pdf_download }}"
    starter_content = "{{ cookiecutter.starter_content }}"
    initialize_git = "{{ cookiecutter.initialize_git }}"

    print("Running post-generation processing...")

    # Rename .jinja template files
    rename_jinja_files()

    # Remove GitLab CI if not using GitLab
    if publishing_platform not in ["gitlab-pages", "gitlab-pages-selfhosted"]:
        remove_file(".gitlab-ci.yml")

    # Remove GitHub Actions if not using GitHub
    if publishing_platform != "github-pages":
        remove_dir(".github")

    # Remove example content if empty was chosen
    if starter_content == "empty":
        remove_dir("docs/example")

    # Initialize git repository if requested
    if initialize_git == "yes":
        print("Initializing git repository...")
        subprocess.run(["git", "init"], check=True)
        subprocess.run(["git", "add", "."], check=True)
        subprocess.run(
            ["git", "commit", "-m", "Initial commit from markdown-chartpress template"],
            check=True
        )
        print("Git repository initialized and first commit created")

    print("Post-generation cleanup complete!")
    print(f"\nNext steps:")
    print(f"  cd {{ cookiecutter.project_slug }}")
    print(f"  npm install")
    print(f"  make dev")


if __name__ == "__main__":
    main()
