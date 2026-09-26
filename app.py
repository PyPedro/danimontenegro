import os

from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

# Configure no Render: WEBHOOK_URL=https://sua-url-de-automacao-nocode.com/webhook
WEBHOOK_URL = os.environ.get('WEBHOOK_URL', 'https://sua-url-de-automacao-nocode.com/webhook')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/agendar', methods=['POST'])
def agendar():
    data = request.json
    
    # 1. Extração dos dados enviados pelo Vue.js
    nome = data.get('name')
    telefone = data.get('phone')
    duracao = data.get('duration')
    sintoma = data.get('symptom')
    
    # 2. Automação: Disparo para o Webhook / CRM
    # Se você configurar um webhook, o Flask enviará a lead silenciosamente para o seu banco de dados
    if WEBHOOK_URL != "https://sua-url-de-automacao-nocode.com/webhook":
        payload = {
            "origem": "Site - Dra Dani",
            "paciente": nome,
            "whatsapp": telefone,
            "tempo_dor": duracao,
            "sintoma_foco": sintoma
        }
        try:
            # Dispara os dados sem travar a requisição do usuário (timeout curto)
            requests.post(WEBHOOK_URL, json=payload, timeout=3)
        except Exception as e:
            print(f"Erro ao integrar com automação: {e}")

    # Retorna sucesso para o frontend prosseguir com o redirect do WhatsApp
    return jsonify({
        "status": "success", 
        "message": "Ficha recebida! O paciente foi encaminhado para o WhatsApp e integrado ao CRM."
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)