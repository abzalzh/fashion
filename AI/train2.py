import torch
from torchvision import transforms
import torch.nn as nn
from PIL import Image

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
class CNN(nn.Module):
    def __init__(self):
        super(CNN, self).__init__()

        self.conv_layers = nn.Sequential(

            nn.Conv2d(3, 32, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2,2),

            nn.Conv2d(32, 64, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2,2),

            nn.Conv2d(64, 128, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2,2)
        )

        self.fc_layers = nn.Sequential(
            nn.Flatten(),
            nn.Linear(32*56*56, 256),
            nn.ReLU(),
            nn.Linear(256, 47)
        )

    def forward(self, x):
        x = self.conv_layers(x)
        x = self.fc_layers(x)
        return x
        
model = CNN()  
model.load_state_dict(torch.load("/kaggle/working/fabrics.pth", map_location=device))
model.to(device)
model.eval()  

preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5,0.5,0.5], std=[0.5,0.5,0.5])
])

img_path = "/kaggle/input/datasets/elisbkh/polyest/polyest.jpeg"  
image = Image.open(img_path).convert("RGB")  
input_tensor = preprocess(image).unsqueeze(0)  
input_tensor = input_tensor.to(device)

with torch.no_grad():  
    output = model(input_tensor)           
    predicted_class = output.argmax(dim=1)
    
class_names = dataset.classes  
print(f"Predicted class: {class_names[predicted_class.item()]}")