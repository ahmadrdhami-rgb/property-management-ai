import { knowledgeBase } from '../data/knowledgeBase'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

const now = new Date()
const currentDateTime = now.toLocaleString('en-PK', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Karachi'
})

export const askAI = async (userMessage, tenantData, payments, documents, maintenanceRequests, conversationHistory = []) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY

  const systemMessage = `You are AI assistant for "Sunrise Heights" PMS.

CURRENT DATE & TIME: ${currentDateTime}

YOU ARE TALKING TO ONLY ONE SPECIFIC TENANT:
- Name: ${tenantData?.name}
- Email: ${tenantData?.email}  
- Unit: ${tenantData?.unit}
- Phone: ${tenantData?.phone}

THIS TENANT'S PAYMENTS ONLY (do not mention other tenants):
${payments?.length === 0
      ? 'This tenant has NO payment records yet.'
      : payments?.map(p =>
        p.month + ': PKR ' + p.amount + ' — ' + p.status +
        (p.paid_date ? ' (Paid: ' + p.paid_date + ', Receipt: ' + p.receipt_no + ')' : '') +
        (p.due_date ? ' (Due: ' + p.due_date + ')' : '')
      ).join('\n')
    }

THIS TENANT'S DOCUMENTS ONLY:
${documents?.length === 0
      ? 'This tenant has NO documents uploaded yet.'
      : documents?.map(d => '- ' + d.name + ' (' + d.type + ', ' + d.size + ')').join('\n')
    }

THIS TENANT'S MAINTENANCE HISTORY:
${maintenanceRequests?.length === 0
      ? 'No maintenance requests.'
      : maintenanceRequests?.map(m => '- ' + m.issue + ' [' + m.status + ']').join('\n')
    }

${knowledgeBase}

STRICT RULES:
1. Only use THIS tenant's data above.
2. If payments list is empty — say "No payment records found for your account."
3. If the user asks for agreement or documents, inform them they can securely view and download all real files from the "Documents" tab on their dashboard interface. Do not hallucinate links.
4. Never mix data from other tenants.
5. Answer greetings warmly.
6. Reply in user's language.
7. Never refuse to answer.`

  // Keep last 6 messages for context
  const recentHistory = conversationHistory.slice(-6)

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemMessage },
          ...recentHistory,
          { role: 'user', content: userMessage }
        ],
        temperature: 0.4,
        max_tokens: 500
      })
    })

    const data = await response.json()

    if (data.error) return 'Error: ' + data.error.message

    return data.choices?.[0]?.message?.content || 'Please try again.'

  } catch (err) {
    return 'Network error. Please try again.'
  }
}
