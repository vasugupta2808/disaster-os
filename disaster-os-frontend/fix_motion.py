import os, re

base_dir = r'c:\Codes\Projects\disaster kali\Disaster of Kali\disaster-os-frontend\components\features'

# All motion.X tags found in the codebase
motion_tags = set()

# First pass: find all motion.X tags used
for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            # Find all <motion.X and </motion.X patterns
            tags = re.findall(r'</?motion\.(\w+)', content)
            for t in tags:
                motion_tags.add(t)

print(f"Found motion tags: {motion_tags}")

# Second pass: fix all files
for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if 'motion.' not in content:
                continue
            
            # Skip already-fixed files (have MotionDiv = motion.div)
            # But still check for remaining motion.X in JSX
            
            original = content
            
            # Find which motion tags this file uses in JSX (not in const assignments)
            used_tags = set()
            for match in re.finditer(r'</?motion\.(\w+)', content):
                used_tags.add(match.group(1))
            
            if not used_tags:
                continue
            
            # Build alias lines
            aliases = []
            for tag in sorted(used_tags):
                alias_name = 'Motion' + tag.capitalize()
                aliases.append(f'const {alias_name} = motion.{tag};')
            
            alias_block = '\n'.join(aliases)
            
            # Remove any existing alias lines (from previous fix attempts)
            content = re.sub(r'const Motion\w+ = motion\.\w+;\n', '', content)
            
            # Insert aliases right after the framer-motion import
            content = re.sub(
                r'(import\s+\{[^}]*\}\s+from\s+["\']framer-motion["\'];?\s*\n)',
                r'\1\n' + alias_block + '\n',
                content
            )
            
            # Replace all <motion.X with <MotionX and </motion.X> with </MotionX>
            for tag in used_tags:
                alias_name = 'Motion' + tag.capitalize()
                content = content.replace(f'<motion.{tag}', f'<{alias_name}')
                content = content.replace(f'</motion.{tag}>', f'</{alias_name}>')
            
            if content != original:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f'Fixed: {path} (tags: {used_tags})')

print("Done!")
