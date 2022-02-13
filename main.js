let notes = [];

const printTotalAmount = () => {
  const total = notes.reduce((previous, next) => {
    return previous + Number(next.amount);
  }, 0);
  document.getElementsByClassName('total-expenses')[0].innerHTML = `Итого: ${total} р.`;
}

const getFromServer = async () => {
  const response = await fetch('http://localhost:8000/allNotes', {
    method: 'GET',
  });

  let result;

  if (response.ok) {
    result = await response.json();
  } else {
    alert(`Error HTTP: ${response.status}`);
    return;
  }

  notes = result.data;
  render();
}

const postOnServer = async (shop, amount, date) => {
  const response = await fetch('http://localhost:8000/createNote',{
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8', 
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      shop,
      amount,
      date
    })
  });
  const result = await response.json();

  if (response.ok) {
    notes.push({
      shop,
      date,
      amount,
      _id: result._id,
    });

    document.getElementsByClassName('print-shop')[0].children[1].value = null;
    document.getElementsByClassName('print-amount')[0].children[1].value = null;
    render();
  } else {
    alert(`Error HTTP: ${response.status}`);
  }
}

const patchOnServer = async (shop, amount, date, _id) => {
  const response = await fetch(`http://localhost:8000/updateNote?_id=${_id}`,{
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json;charset=utf-8', 
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      shop,
      amount,
      date,
      _id
    })
  });
  const result = await response.json();

  if (response.ok) {
    notes.forEach(elem => {

      if (elem._id === _id) {
        elem.shop = shop;
        elem.amount = amount;
        elem.date = date;
      }
    });
    render();
  }
}

const deleteFromServer = async (_id) => {
  const response = await fetch(`http://localhost:8000/deleteNote?_id=${_id}`,{
    method: 'DELETE',
  });

  if (response.ok) {
    notes = notes.filter(elem => elem._id !== _id);
    render();
  } else {
    alert(`Error HTTP: ${response.status}`);
  }
}

const render = () => {
  let divsArray = [];

  notes.forEach((el, i) => {
    const { _id, shop, date, amount } = el;
    const div = `<div class="expense" id=${_id}>
                  <div class="shop">
                    <p>
                    ${notes.length - i}. 
                    </p>
                    <div contenteditable="true" class="editable-data" disabled ondblclick="editOneNoteText(event)">${shop}</div>
                  </div>
                  <div class="date-amount-wrapper">
                    <input class="date editable-data" readonly="true" ondblclick="editOneDate(event)" type="text" value="${date}"></input>
                    <input class="amount editable-data" readonly="true" ondblclick="editOneAmount(event)" type="text" value="${amount} р."></input>
                    <div class="buttons">
                      <button class="edit" onclick="editNote(event)">
                        <img src="images/edit-icon.png">
                      </button>
                      <button class="delete" onclick="deleteNote(event)">
                        <img src="images/trash-icon.png">
                      </button>
                    </div>
                  </div>
                </div>`;

    divsArray.unshift(div);
  });

  const allDivs = divsArray.join('');
  document.getElementsByClassName('expenses-root')[0].innerHTML = allDivs;
  printTotalAmount();
}  

const addNote = (event) => {
  const parentDiv = event.target.parentElement;
  const [, shopInput] = parentDiv.children[0].children;
  const [, amountInput] = parentDiv.children[1].children;
  const date = new Date(); 

  postOnServer(
                shopInput.value, 
                amountInput.value, 
                `${date.getDate()}.${date.getMonth()}.${date.getFullYear()}`
              );
}

const editNote = (event) => {
  const parentDiv = event.target.parentElement.parentElement.parentElement.parentElement;
  const [, shopInput] = parentDiv.children[0].children;
  const [dateInput, amountInput] = parentDiv.children[1].children;
  const date = new Date();
  const _id = parentDiv.id;

  const previousShopName = shopInput.textContent;
  const previousDate = dateInput.value;
  const previousAmount = amountInput.value.substring(0, amountInput.value.indexOf(' '));

  shopInput.disabled = false;
  shopInput.classList.value = 'editable-data ready-to-edit';
  shopInput.ondblclick = undefined;

  dateInput.readOnly = false;
  dateInput.value = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  dateInput.type = 'date';
  dateInput.classList.value = 'date editable-data ready-to-edit';
  dateInput.ondblclick = undefined;

  amountInput.readOnly = false;
  amountInput.value = +amountInput.value.substring(0, amountInput.value.indexOf(' '));
  amountInput.type = 'number';
  amountInput.classList.value = 'amount editable-data ready-to-edit';
  amountInput.ondblclick = undefined;

  const buttons = document.getElementsByClassName('buttons')[0];
  buttons.innerHTML = `<button class="edit" onclick="editNote(event)">
                         <img src="images/ok.png">
                       </button>
                       <button class="delete">
                         <img src="images/undo.png">
                       </button>`;
  const [okButton, undoButton] = parentDiv.children[1].children[2].children;
  
  okButton.onclick = async () => {
    notes.forEach(elem => {
      if (elem._id === _id) {
        const date = new Date(dateInput.value);
        const newDate = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;

        patchOnServer(shopInput.textContent, amountInput.value, newDate, _id);
      }
    });
  }

  undoButton.onclick = async () => {
    patchOnServer(previousShopName, previousAmount, previousDate, _id);
  }
}

const editOneNoteText = (event) => {
  const elementHTML = event.target;
  const _id = event.target.parentElement.parentElement.id;
  elementHTML.disabled = false;
  elementHTML.classList.toggle('ready-to-edit');

  elementHTML.onblur = async () => {
    notes.forEach(elem => {
      if (elem._id === _id) {
        patchOnServer(elementHTML.textContent, elem.amount, elem.date, _id);
      }

      elementHTML.disabled = true;
      elementHTML.classList.remove('ready-to-edit');
    });
  }
}

const editOneDate = (event) => {
  const elementHTML = event.target;
  const _id = event.target.parentElement.parentElement.id;
  const date = new Date();

  elementHTML.readOnly = false;
  elementHTML.classList.toggle('ready-to-edit');
  elementHTML.value = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  elementHTML.type = 'date';

  elementHTML.onblur = async () => {

    notes.forEach(elem => {
      if ({_id} === elem) {
        const date = new Date(elementHTML.value);
        const newDate = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
        patchOnServer(elem.shop, elem.amount, newDate, _id);
      }

      elementHTML.readOnly = true;
      elementHTML.classList.remove('ready-to-edit');
    });
  }
}

const editOneAmount = (event) => {
  const elementHTML = event.target;
  const _id = event.target.parentElement.parentElement.id;

  elementHTML.readOnly = false;
  elementHTML.classList.toggle('ready-to-edit');
  elementHTML.value = +elementHTML.value.substring(0, elementHTML.value.indexOf(' '));
  elementHTML.type = 'number';

  elementHTML.onblur = async () => {
    const elementInArray = notes.find(elem => elem._id === _id); 
    patchOnServer(elementInArray.shop, elementHTML.value, elementInArray.date, _id);
      
    elementHTML.disabled = true;
    elementHTML.classList.remove('ready-to-edit');
  }
}

const deleteNote = (event) => {
  const parentDiv = event.target.parentElement.parentElement.parentElement.parentElement;
  const _id = parentDiv.id;

  deleteFromServer(_id);
} 

window.onload = async () => {
  getFromServer();
}