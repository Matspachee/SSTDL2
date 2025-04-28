function validateJSON() {
    const schemaText = document.getElementById('schema').value;
    const dataText = document.getElementById('data').value;
    const resultDiv = document.getElementById('result');
  
    try {
      const schema = JSON.parse(schemaText);
      const data = JSON.parse(dataText);
  
      const ajv = new Ajv();
      const validate = ajv.compile(schema);
      const valid = validate(data);
  
      if (valid) {
        resultDiv.innerHTML = '✅ ¡Datos válidos!';
        resultDiv.className = 'result success';
      } else {
        resultDiv.innerHTML = '❌ Datos inválidos:<br><ul>' +
          validate.errors.map(err => `<li><strong>${err.dataPath || '(raíz)'}</strong> ${err.message}</li>`).join('') +
          '</ul>';
        resultDiv.className = 'result error';
      }
      resultDiv.style.display = 'block';
  
    } catch (error) {
      resultDiv.innerHTML = '❌ Error de formato JSON: ' + error.message;
      resultDiv.className = 'result error';
      resultDiv.style.display = 'block';
    }
  }
  
  function clearFields() {
    document.getElementById('schema').value = '';
    document.getElementById('data').value = '';
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'none';
  }
  
  function showTab(tabId) {
    const validatorTab = document.getElementById('validator');
    const examplesTab = document.getElementById('examples');
    const tabButtons = document.querySelectorAll('.tab-btn');
  
    validatorTab.style.display = tabId === 'validator' ? 'block' : 'none';
    examplesTab.style.display = tabId === 'examples' ? 'block' : 'none';
  
    tabButtons.forEach(btn => btn.classList.remove('active'));
    if (tabId === 'validator') {
      tabButtons[0].classList.add('active');
    } else {
      tabButtons[1].classList.add('active');
    }
  }  