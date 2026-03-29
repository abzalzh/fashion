import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader


transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5, 0.5, 0.5],
                         std=[0.5, 0.5, 0.5])
])


dataset = datasets.ImageFolder(
    root="/kaggle/input/datasets/jmexpert/describable-textures-dataset-dtd/dtd/images",  
    transform=transform
)
batch_size = 32
dataloader = DataLoader(dataset, batch_size, shuffle=True)
print(len(dataset.classes))
print(dataset.classes)



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
optimizer = optim.Adam(model.parameters(), lr=1e-3)
loss_func = nn.CrossEntropyLoss()  

epochs = 100  
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)

for epoch in range(epochs):
    total_loss = 0
    for imgs, labels in dataloader:
        imgs, labels = imgs.to(device), labels.to(device).squeeze()

        optimizer.zero_grad()
        out = model(imgs)
        loss = loss_func(out, labels)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()
    
    print(f"Epoch {epoch+1}/{epochs}, Loss: {total_loss/len(dataloader):.4f}")


torch.save(model.state_dict(), "/kaggle/working/fabrics.pth")  