import os, re

base_dir = r'c:\Codes\Projects\disaster kali\Disaster of Kali\disaster-os-frontend\components\features'

for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original = content
            
            # Remove the const aliases
            content = re.sub(r'^const Motion\w+ = motion\.\w+;\n?', '', content, flags=re.MULTILINE)
            
            # Revert all <MotionX to <motion.x
            def repl(match):
                tag = match.group(1).lower()
                return f'<motion.{tag}'
            
            content = re.sub(r'<Motion([A-Z][a-z]+)', repl, content)
            
            def repl_close(match):
                tag = match.group(1).lower()
                return f'</motion.{tag}'
                
            content = re.sub(r'</Motion([A-Z][a-z]+)', repl_close, content)
            
            if content != original:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f'Reverted motion in: {path}')

print("Done!")
