import pandas as pd
import os
import markdown
locale="en"
target="pt"

filePath=os.path.join("app","content","dtpr", "elements")

elementDict={
    "element id":[],
    "english element":[],
    "translated element":[],
    "english description":[],
    "translated description":[]
}

# for file in os.listdir(os.path.join(filePath, target)):
#     newName=""
#     with open(os.path.join(filePath, target, file), 'r', encoding='utf-8') as f:
#         contents=[line.strip() for line in f.readlines()]
#         category=contents[1][10:]
#         elementId=contents[3][4:]
#         newName=category.lower()+"_"+elementId.lower()+".md"
#         newName=newName.strip()
#         print(newName)
#     os.rename(os.path.join(filePath, target,file), os.path.join(filePath, target, newName))

for filename in os.listdir(os.path.join(filePath, target)):
    with open(os.path.join(filePath, locale, filename), 'r', encoding='utf-8') as f:
        contents=[line.strip() for line in f.readlines()]
        start=[index for index, s in enumerate(contents) if s[:12]=="description:"][0]
        end=[index for index, s in enumerate(contents) if s[:5]=="icon:"][0]
        elementId=contents[3][4:]
        elementName=contents[2].lstrip("name: ")
        elementDescription=' '.join(contents[start:end]).lstrip("description: ")
        print(elementDescription)
        index=0
        if elementId in elementDict["element id"]:
            index=elementDict["element id"].index(elementId)
        else:
            elementDict["element id"].insert(0,elementId)
        elementDict["english element"].insert(index,elementName)
        elementDict["english description"].insert(index, elementDescription)

    with open(os.path.join(filePath, target, filename), 'r', encoding='utf-8') as f:
        contents=[line.strip() for line in f.readlines()]
        start=[index for index, s in enumerate(contents) if s[:12]=="description:"][0]
        end=[index for index, s in enumerate(contents) if s[:5]=="icon:"][0]
        elementId=contents[3][4:]
        elementName=contents[2].lstrip("name: ")
        elementDescription=' '.join(contents[start: end]).lstrip("description: ")
        
        
        index=0
        if elementId in elementDict["element id"]:
            index=elementDict["element id"].index(elementId)
        else:
            elementDict["element id"].insert(0,elementId)
        elementDict["translated element"].insert(index, elementName)
        elementDict["translated description"].insert(index, elementDescription)

df=pd.DataFrame(elementDict)
df.to_csv("translations.csv")



