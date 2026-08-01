import os, re

dashboard_dir = r'c:\Codes\Projects\disaster kali\Disaster of Kali\disaster-os-frontend\app\(dashboard)'

import_pattern = re.compile(r'import\s+\{\s*PageHelpVideo\s*\}\s+from\s+[\'"].*?page-help-video[\'"];?\n')
video_pattern = re.compile(r'\s*<PageHelpVideo\s+title=.*?/>', re.DOTALL)

for root, dirs, files in os.walk(dashboard_dir):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = import_pattern.sub('', content)
            new_content = video_pattern.sub('', new_content)
            
            if content != new_content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Cleaned {path}')
