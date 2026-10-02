const { createApp, ref, reactive, nextTick, computed } = Vue
const clinicWhatsAppNumber = '558198450666';

createApp({
    setup() {
        const isModalOpen = ref(false);
        const isTyping = ref(false);
        const chatMessages = ref([]);
        const currentStep = ref('name');
        const userInput = ref('');
        
        const appointmentData = reactive({
            name: '',
            symptom: '',
            duration: '',
            date: '',
            time: '',
            phone: ''
        });

        const getPlaceholder = computed(() => {
            const placeholders = {
                'name': 'Digite seu nome...',
                'symptom': 'Escolha acima ou digite...',
                'duration': 'Escolha ou digite...',
                'date': 'Escolha no calendário ou digite...',
                'time': 'Escolha ou digite o horário...',
                'phone': 'Ex: (00) 00000-0000'
            };
            return placeholders[currentStep.value] || 'Digite sua mensagem...';
        });

        // -----------------------------------------------------
        // GERADOR DO CALENDÁRIO MENSAL
        // -----------------------------------------------------
        const generateCalendar = () => {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth(); 
            
            const firstDayOfMonth = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            let days = [];
            
            // Espaços em branco para alinhar os dias da semana
            for(let i = 0; i < firstDayOfMonth; i++) {
                days.push({ blank: true });
            }
            
            // Gera os dias do mês
            for(let i = 1; i <= daysInMonth; i++) {
                const dateObj = new Date(year, month, i);
                
                const todayStripped = new Date();
                todayStripped.setHours(0,0,0,0);
                const thisDateStripped = new Date(year, month, i);
                
                const isPast = thisDateStripped <= todayStripped;
                const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                const isAvailable = !isPast && !isWeekend; // Dias úteis futuros
                
                const monthStr = String(month + 1).padStart(2, '0');
                const dayStr = String(i).padStart(2, '0');
                const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                
                days.push({
                    blank: false,
                    day: i,
                    isAvailable: isAvailable,
                    value: `${dayStr}/${monthStr} (${weekdays[dateObj.getDay()]})`
                });
            }
            
            const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            const monthName = `${monthNames[month]} ${year}`;
            
            return { monthName, days };
        };

        const availableTimes = [
            { label: '09:00', value: '09:00' },
            { label: '14:00', value: '14:00' },
            { label: '16:30', value: '16:30' }
        ];

        const scrollToBottom = () => {
            nextTick(() => {
                const container = document.getElementById('chatContainer');
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            });
        };

        const pushMessage = (sender, text, options = null, action = null, calendarData = null) => {
            chatMessages.value.push({ sender, text, options, action, calendarData, isCalendar: !!calendarData });
            scrollToBottom();
        };

        const botReply = (text, delay = 1200, options = null, action = null, calendarData = null) => {
            isTyping.value = true;
            scrollToBottom();
            setTimeout(() => {
                isTyping.value = false;
                pushMessage('bot', text, options, action, calendarData);
            }, delay);
        };

        const initChat = () => {
            chatMessages.value = [];
            currentStep.value = 'name';
            userInput.value = '';
            Object.keys(appointmentData).forEach(k => appointmentData[k] = '');
            pushMessage('bot', 'Olá! Que bom ter você aqui. Sou a assistente da Dra. Dani Montenegro. 😊 Como você prefere ser chamado(a)?');
        };

        const openModal = () => {
            const message = 'Olá! Gostaria de agendar uma consulta com a Dra. Dani Montenegro.';
            const whatsappUrl = `https://wa.me/${clinicWhatsAppNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        };
        
        const closeModal = () => {
            isModalOpen.value = false;
        };

        const matchSymptom = (text) => {
            const norm = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            if (norm.match(/dor|cabeca|atm|face|estalo/)) return 'Dores na Face / ATM';
            if (norm.match(/bruxismo|aperta|ranger|sono/)) return 'Bruxismo / Sono';
            if (norm.match(/clareamento|branco|estetica/)) return 'Clareamento';
            if (norm.match(/limpeza|profilaxia|tartaro/)) return 'Limpeza Bucal';
            if (norm.match(/ortodontia|aparelho|alinhador/)) return 'Ortodontia';
            if (norm.match(/canal|endodontia/)) return 'Endodontia';
            if (norm.match(/restauracao|carie|quebrado|resina/)) return 'Restauração';
            if (norm.match(/laser|herpes|afta|candida/)) return 'Laserterapia';
            if (norm.match(/hospitalar|oncologico/)) return 'Odonto. Hospitalar';
            if (norm.match(/halito|saliva|boca seca/)) return 'Sialometria / Hálito';
            
            return text; 
        };

        const advanceChat = (userText, optionValue) => {
            if (currentStep.value === 'name') {
                appointmentData.name = userText;
                currentStep.value = 'symptom';
                
                const symptomOptions = [
                    { label: 'Dores na Face / ATM', value: 'Dores na Face / ATM' },
                    { label: 'Bruxismo / Sono', value: 'Bruxismo / Sono' },
                    { label: 'Clareamento Dental', value: 'Clareamento' },
                    { label: 'Limpeza e Higiene', value: 'Limpeza Bucal' },
                    { label: 'Ortodontia', value: 'Ortodontia' },
                    { label: 'Endodontia (Canal)', value: 'Endodontia' },
                    { label: 'Restauração', value: 'Restauração' },
                    { label: 'Laserterapia', value: 'Laserterapia' },
                    { label: 'Odontologia Hospitalar', value: 'Odonto. Hospitalar' },
                    { label: 'Mau Hálito / Saliva', value: 'Sialometria / Hálito' },
                    { label: 'Outro', value: 'Outro' }
                ];
                botReply(`Prazer em conhecer você, <strong>${appointmentData.name.split(' ')[0]}</strong>! Me conta um pouquinho: qual o principal motivo do seu agendamento hoje? Você pode escolher uma opção ou digitar o que precisa.`, 1500, symptomOptions);
            } 
            else if (currentStep.value === 'symptom') {
                let val = optionValue || matchSymptom(userText);
                appointmentData.symptom = val;
                currentStep.value = 'duration';
                
                const isPain = ['Dores na Face / ATM', 'Bruxismo / Sono'].includes(val) || userText.toLowerCase().includes('dor');

                if (isPain) {
                    botReply('Ah, entendi. Sinto muito que esteja passando por isso. Ninguém merece sentir dor ou desconforto, né? 😔', 1500);
                    botReply('Há quanto tempo você vem lidando com isso?', 3000, [
                        { label: 'Faz poucos dias', value: 'Poucos dias' },
                        { label: 'Já tem alguns meses', value: 'Alguns meses' },
                        { label: 'Há anos (Crônico)', value: 'Anos (Crônico)' }
                    ]);
                } else {
                    botReply('Ótimo! Vai ser um prazer imenso cuidar da sua saúde bucal e do seu sorriso. ✨', 1500);
                    botReply('Para eu registrar na sua ficha, há quanto tempo você estava buscando ou planejando esse atendimento?', 3000, [
                        { label: 'Decidi recentemente', value: 'Pouco tempo' },
                        { label: 'Já tem alguns meses', value: 'Alguns meses' },
                        { label: 'Sempre quis fazer', value: 'Muito tempo' }
                    ]);
                }
            }
            else if (currentStep.value === 'duration') {
                appointmentData.duration = optionValue || userText;
                currentStep.value = 'date';
                
                botReply('Certo, já anotei aqui. Deixa eu dar uma olhadinha na agenda da Dra. Dani para vermos o melhor dia... Só um instante! ⏳', 1500);
                
                const calData = generateCalendar();
                botReply('Prontinho! Aqui está a nossa agenda. Os dias em destaque estão disponíveis para avaliação. Qual fica melhor para você? (Ou digite outro dia se preferir).', 3500, null, null, calData);
            }
            else if (currentStep.value === 'date') {
                appointmentData.date = optionValue || userText;
                currentStep.value = 'time';
                
                botReply(`Perfeito! Para o dia <strong>${appointmentData.date}</strong>, tenho esses horários livres. Qual você prefere (ou digite outro horário)?`, 1500, availableTimes);
            }
            else if (currentStep.value === 'time') {
                appointmentData.time = optionValue || userText;
                currentStep.value = 'phone';
                
                botReply('Ótima escolha! Pra gente finalizar e eu já deixar o seu horário pré-reservado, qual é o seu WhatsApp (com DDD)?', 1500);
            }
            else if (currentStep.value === 'phone') {
                appointmentData.phone = userText; 
                currentStep.value = 'finish';
                
                botReply(`Tudo certinho, <strong>${appointmentData.name.split(' ')[0]}</strong>! Seu pré-agendamento para <strong>${appointmentData.date} às ${appointmentData.time}</strong> está salvo aqui comigo. ✨`, 1800);
                botReply(`Agora é só clicar no botão abaixo. Eu vou te transferir para a nossa equipe humana lá no WhatsApp, e as meninas vão te receber para confirmar tudinho e te passar as orientações, tá bem? Um abraço!`, 3500, null, 'redirect');
            }
        };

        const handleSend = () => {
            const text = userInput.value.trim();
            if (!text) return;
            pushMessage('user', text);
            userInput.value = '';
            advanceChat(text, null);
        };

        const selectOption = (opt) => {
            pushMessage('user', opt.label);
            advanceChat(opt.label, opt.value);
        };

        // Função para quando clica no calendário
        const selectDate = (dayObj) => {
            pushMessage('user', dayObj.value);
            advanceChat(dayObj.value, dayObj.value);
        };

        const finalizeScheduling = () => {
            try {
                fetch('/api/agendar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(appointmentData)
                });
            } catch(e) { console.log('Integração disparada') }

            const phone = clinicWhatsAppNumber;
            
            const text = `Olá, meninas! Acabei de falar com a assistente virtual no site e gostaria de confirmar meu agendamento.%0A%0A📋 *RESUMO DO ATENDIMENTO:*%0A👤 *Nome:* ${appointmentData.name}%0A📞 *WhatsApp:* ${appointmentData.phone}%0A🚨 *Procedimento:* ${appointmentData.symptom}%0A⏳ *Tempo:* ${appointmentData.duration}%0A📅 *Data escolhida:* ${appointmentData.date}%0A⏰ *Horário:* ${appointmentData.time}`;
            
            const whatsappUrl = `https://wa.me/${phone}?text=${text}`;
            window.open(whatsappUrl, '_blank');
            closeModal();
        };

        return {
            isModalOpen, openModal, closeModal, 
            chatMessages, currentStep, userInput, isTyping, getPlaceholder,
            handleSend, selectOption, selectDate, finalizeScheduling
        }
    }
}).mount('#app')