import os, re

base_dir = r'c:\Codes\Projects\disaster kali\Disaster of Kali\disaster-os-frontend\components\features'

for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Find all const MotionX = motion.X; lines
            motion_lines = re.findall(r'^const Motion\w+ = motion\.\w+;$', content, re.MULTILINE)
            if not motion_lines:
                continue
            
            # Remove them from their current location
            content = re.sub(r'^const Motion\w+ = motion\.\w+;\n?', '', content, flags=re.MULTILINE)
            
            # Find the last import statement
            imports = list(re.finditer(r'^import .*?;?$', content, re.MULTILINE))
            if imports:
                last_import = imports[-1]
                insert_pos = last_import.end() + 1
            else:
                insert_pos = 0
            
            # Insert the motion lines after the last import
            motion_block = '\n' + '\n'.join(motion_lines) + '\n'
            content = content[:insert_pos] + motion_block + content[insert_pos:]
            
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Fixed imports in: {path}')

print("Done!")
