# Painel IoT - Dashboard Mobile

Aplicativo móvel de controle e monitoramento para sistema IoT com Arduino/ESP.

## 🚀 Como executar

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar o IP do backend
Abra o arquivo `App.js` e edite a linha 17 com o IP da sua máquina:
```javascript
const API_BASE_URL = 'http://SEU_IP_LOCAL:8000';
```

**Como descobrir seu IP local:**
- Windows: Execute `ipconfig` no CMD e procure por "Endereço IPv4"
- Mac/Linux: Execute `ifconfig` ou `ip addr`

### 3. Iniciar o projeto
```bash
npm start
```

### 4. Executar no dispositivo
- **Físico**: Instale o app "Expo Go" na Play Store/App Store e escaneie o QR code
- **Android**: Pressione `a` no terminal (requer Android Studio)
- **iOS**: Pressione `i` no terminal (requer Xcode - apenas Mac)
- **Web**: Pressione `w` no terminal

## 📱 Funcionalidades

### Monitoramento de Sensor
- Visualização em tempo real da distância
- Atualização automática a cada 3 segundos
- Histórico das últimas 10 leituras
- Data/hora de cada medição

### Configuração de Limite
- Carregamento do limite atual
- Edição do valor de sensibilidade
- Salvamento com confirmação

## 🔧 Tecnologias
- React Native
- Expo
- Fetch API para comunicação com backend

## ⚠️ Importante
- Certifique-se de que o backend está rodando na porta 8000
- O dispositivo móvel deve estar na mesma rede Wi-Fi que o backend
