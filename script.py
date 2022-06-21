# 1: Install pdfplumber from terminal : `pip3 install pdfplumber`
# 2: Save pdf to a project folder as `target.pdf`
# 3: Password is of the format: <prefix><some_unknown_number><suffix>
# 4: Download `script.py` file and save to the same folder
# 5: Run this program from terminal as `python3 script.py`

import pdfplumber

is_found=False
for i in range (100,2000):
  pwd = 'prefix' + str(i) + 'suffix'
  try:
    with pdfplumber.open(r'target.pdf', password = pwd) as pdf:
        first_page = pdf.pages[0]
        print(first_page.extract_text())
        print(str(pwd) + ' is the password')
        break
  except Exception as e:
    # print(str(pwd) + ' failed')
    pass

if not is_found:
    print("password not found")

print("!! Program Running Successfully !!")
