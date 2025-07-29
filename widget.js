// Retrieve the apiKey parameter you set when registering the widget
const apiKey = JFCustomWidget.getWidgetSetting('apiKey');
if (!apiKey) {
  document.body.innerHTML = '<p style="color:red">Error: you must set the apiKey parameter in your widget settings</p>';
  throw new Error('apiKey parameter missing');
}

// Utility: send both roughPoints and report back to JotForm
function sendAll() {
  const payload = {
    roughPoints: document.getElementById('roughPoints').value || '',
    report: document.getElementById('report').value || ''
  };
  JFCustomWidget.sendData({ value: JSON.stringify(payload) });
}

// Subscribe to form load (fresh / draft / edit)
JFCustomWidget.subscribe('ready', function(data) {
  let saved = {};
  if (data && data.value) {
    try { saved = JSON.parse(data.value); } catch (e) { console.error('Failed to parse saved data', e); }
  }
  // Populate fields if saved data exists
  document.getElementById('roughPoints').value = saved.roughPoints || '';
  document.getElementById('report').value      = saved.report || '';

  // Update JotForm whenever inputs change
  document.getElementById('roughPoints').addEventListener('input', sendAll);
  document.getElementById('report').addEventListener('input', sendAll);
});

// Handle Generate button click using OpenAI API
document.getElementById('generate').addEventListener('click', async function() {
  const rough = document.getElementById('roughPoints').value.trim();
  if (!rough) { alert('Please enter some rough points first'); return; }

  const endpoint = 'https://api.openai.com/v1/chat/completions';
  const body = {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: rough }],
    temperature: 0.7,
    max_tokens: 512
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    const generated = (json.choices && json.choices[0].message.content) || '';
    document.getElementById('report').value = generated;
  } catch (err) {
    console.error('API error', err);
    alert('Failed to generate report. Check your API key and network.');
  }

  // After generation, save updated state
  sendAll();
});

// On final form submission, send the complete widget value and mark valid
JFCustomWidget.subscribe('submit', function() {
  const payload = {
    roughPoints: document.getElementById('roughPoints').value || '',
    report: document.getElementById('report').value || ''
  };
  const isValid = payload.roughPoints.trim() !== '' && payload.report.trim() !== '';
  JFCustomWidget.sendSubmit({ valid: isValid, value: JSON.stringify(payload) });
});
