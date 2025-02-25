export function main(fetchDishesList, words, globalData) {
  //Глобальные переменные
  const lang = document.documentElement.lang;
  const body = document.querySelector('body');
  const annonceBblockDiv = document.querySelector('.annonce-block');
  const sendOrderButton = document.getElementById('sendOrder');
  const yourOrderButton = document.getElementById('yourOrder');
  const basketButtonOpen = document.querySelector('.basket');
  const basketButtonClouse = document.querySelector('.basket-clouse');
  const basketBox = document.querySelector('.basket-box');
  const orderBoxDiv = document.querySelector('.order-box');
  const payOrderButton = document.querySelector('#payOrderButton');
  const wrapperDiv = document.querySelector('.wrapper');
  const dialogBoxDiv = document.querySelector('.dialogBox');

  // Функция для нажатия на кнорку оплатить
  payOrderButton.addEventListener('click', () => {
    dialogBoxAppears('selectPaymentMethod')
  })

  // Функция для формирования диологового окна
  function dialogBoxAppears(type, text = '') {
    dialogBoxDiv.innerHTML = '';
    switch (type) {
      case 'selectPaymentMethod':
        dialogBoxDiv.innerHTML = `
        <p>${words[lang].selectPaymentMethod}</p>
        <div class="dialogBox__buttons">
          <button id="cashButton">${words[lang].cash}</button>
          <button id="bankCardButton">${words[lang].bankCard}</button>
          <button class='cancel-button' id="cancelButton">${words[lang].cancelButton}</button>
        </div>
      `;
        wrapperDiv.classList.add('wrapper_active');
        dialogBoxDiv.querySelector('#cashButton').addEventListener('click', async () => {
          dialogBoxDiv.classList.add('event_none');
          const trySend = await sendMessageForPay('cash');
          if (trySend === 'ok') {
            dialogBoxAppears('info', `${words[lang].waiterWillCome}`)
          } else {
            dialogBoxAppears('info', `${words[lang].errorInviteWaiter}`);
          }
          dialogBoxDiv.classList.remove('event_none');
        });
        dialogBoxDiv.querySelector('#bankCardButton').addEventListener('click', async () => {
          dialogBoxDiv.classList.add('event_none');
          const trySend = await sendMessageForPay('bankCard');
          if (trySend === 'ok') {
            dialogBoxAppears('info', `${words[lang].waiterWillCome}`)
          } else {
            dialogBoxAppears('info', `${words[lang].errorInviteWaiter}`);
          }
          dialogBoxDiv.classList.remove('event_none');
        });

        dialogBoxDiv.querySelector('#cancelButton').addEventListener('click', () => {
          wrapperDiv.classList.remove('wrapper_active');
        });
        break;

      case 'info':
        dialogBoxDiv.innerHTML = `
        <p>${text}</p>
        <div class="dialogBox__buttons">
          <button class='cancel-button' id="cancelButton">Ок</button>
        </div>
      `;
        wrapperDiv.classList.add('wrapper_active');
        dialogBoxDiv.querySelector('#cancelButton').addEventListener('click', () => {
          wrapperDiv.classList.remove('wrapper_active');
        });
        break;

      case 'inpitTableNumber':
        dialogBoxDiv.innerHTML = `
        <p>${words[lang].textAskTableNumber}</p>
        <input type='number' placeholder="№">
        <div class="dialogBox__buttons">
          <button id="ok">Ок</button>
          <button class='cancel-button' id="cancelButton">${words[lang].cancelButton}</button>
        </div>
      `;
        wrapperDiv.classList.add('wrapper_active');
        dialogBoxDiv.querySelector('#cancelButton').addEventListener('click', () => {
          wrapperDiv.classList.remove('wrapper_active');
        });
        dialogBoxDiv.querySelector('#ok').addEventListener('click', () => {
          const inputText = dialogBoxDiv.querySelector('input').value;
          if (inputText == 'null' || isNaN(inputText) || inputText == '' || inputText === null) {
            dialogBoxDiv.querySelector('p').innerText = `${words[lang].enterCorrectly}`;
          } else {
            tableNumber = parseInt(inputText);
            sendOrder();
          };
        });
        break;

      default:
        break;
    }
  }

  // Функция для отправки заявки на оплату
  async function sendMessageForPay(type) {
    const paymentMethod = type === 'cash' ? `${words[globalData.mainLang].cash}` : `${words[globalData.mainLang].bankCard}`;
    const apiUrl = `https://api.telegram.org/bot${globalData.botToken}/sendMessage`;
    let orderListText = '';
    let orderListTextforGoogle = '';
    let portionNumberMessage = 0;
    let totalCostMessage = 0;

    ordersList.forEach(item => {
      portionNumberMessage += 1;
      orderListTextforGoogle += `🔴${portionNumberMessage}. ${item.dishNameMainLang} (${item.mainLangCategory}) - ${item.portionName} x ${item.portionNumber} = ${item.totalCost}${globalData.currencySymbol}    `;
      orderListText += `\n${portionNumberMessage}. ${item.dishNameMainLang} (${item.mainLangCategory}) - ${item.portionName} x ${item.portionNumber} = ${item.totalCost}${globalData.currencySymbol}\n${item.dishName}\n`;
      totalCostMessage += item.totalCost;
    });
    const variables = {
      userLang: lang,
      orderId: orderId,
      tableNumber: tableNumber,
      paymentMethod: paymentMethod,
      orderListText: orderListText,
      totalCostMessage: totalCostMessage,
      currencySymbol: globalData.currencySymbol,

    };
    let fullText = Object.keys(variables).reduce((text, key) => {
      // Если это orderId, оборачиваем его в обратные кавычки для машинописного шрифта
      if (key === 'orderId') {
        return text.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), `\`${variables[key]}\``);
      }
      // Для остальных переменных подставляем обычные значения
      return text.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), variables[key]);
    }, words[globalData.mainLang].textMessage);
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: globalData.chatId,
          text: fullText,
          parse_mode: 'Markdown',
        }),
      });
      sendStatisticToForm(orderId, lang, tableNumber, clientType, orderListTextforGoogle, totalCostMessage, type);

      const data = await response.json();
      return data.ok ? 'ok' : 'error';
    } catch (error) {
      return 'error';
    }
  }


  // открытие и закрытие корзины
  function basketBoxOpenClouse() {
    basketButtonOpen.classList.toggle('button_moveLeft');
    basketButtonClouse.classList.toggle('basket-clouse_active');
    basketBox.classList.toggle('basket-box_open');
  }
  basketButtonOpen.onclick = function () {
    basketBoxOpenClouse()
  }
  basketButtonClouse.onclick = function () {
    basketBoxOpenClouse()
  }

  // функция для добавления ссылки на google
  const addressLinkA = document.querySelector('#google-link');
  addressLinkA.setAttribute('href', globalData.googleLink);
  addressLinkA.querySelector('span').innerText = 'Оставить отзыв';

  //Проверка версии
  if (globalData.version == 'basik') {
    sendOrderButton.disabled = true;
    body.classList.add('event_none');
    sendOrderButton.classList.add('display_none');
  } else {
    sendOrderButton.disabled = false;
    annonceBblockDiv.classList.add('displayNone');
    body.classList.remove('event_none');
  }

  //функция для скрытия предупреждения
  document.querySelector('#annonce-block-clouse').onclick = function () {
    document.querySelector('.annonce-block').classList.add('displayNone');
    body.classList.remove('event_none');
  }

  //Функция рендера страницы на нужном языке
  for (let key in words[lang]) {
    if (document.querySelector(`#${key}`)) {
      document.querySelector(`#${key}`).innerHTML = words[lang][key];
    }
  }

  //Функция открытия и закрытия ордера
  yourOrderButton.addEventListener('click', () => {
    orderBoxDiv.classList.add('_show');
  });
  document.getElementById('orderBoxClouse').addEventListener('click', () => {
    orderBoxDiv.classList.remove('_show');
  });

  //изменяемые переменные необходимые для работы с меню
  let userSavedData;
  let currentCategory = '';
  let storeData = [];
  let basketList = [];
  let ordersList = [];
  let tableNumber = '';
  let orderId = '';
  let clientType = '';

  fetchDishesList()
    .then(dishesList => {
      storeData = dishesList;
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0'); // День
      const month = String(now.getMonth() + 1).padStart(2, '0'); // Месяц
      const year = now.getFullYear(); // Год
      const date = `${day}.${month}.${year}`;

      if (localStorage.getItem(`userData-${globalData.cafeName}`)) {
        clientType = 'constantly';
        if (JSON.parse(localStorage.getItem(`userData-${globalData.cafeName}`)).datelastVisit != date) {
          console.log(date);

          localStorage.removeItem(`userData-${globalData.cafeName}`);
          if (localStorage.getItem('table') != 'null') {
            tableNumber = localStorage.getItem('table');
          }

        } else {
          userSavedData = JSON.parse(localStorage.getItem(`userData-${globalData.cafeName}`));
          orderId = userSavedData.userOrderID;
          tableNumber = userSavedData.userTableNumber;
          yourOrderButton.innerHTML = `Ваш закза<br>№ ${orderId}`;
          ordersList = userSavedData.userOrderList;
          if (ordersList.length > 0) {
            yourOrderButton.classList.add('_active');
            yourOrderButton.classList.remove('_display_none');
            renderOrderList();
          }
          basketList = userSavedData.userBascketList;
          if (basketList.length > 0) {
            renderBasketList();
            basketButtonOpen.classList.add('basket_have');
            sendOrderButton.disabled = false;
            sendOrderButton.classList.remove('_display_none');
          }
        }
      } else {
        clientType = 'new';
        if (localStorage.getItem('table') != 'null') {
          tableNumber = localStorage.getItem('table');
        }
      }
      renderDishesCategoryList(storeData);

      setTimeout(() => {
        document.querySelector('.loader').classList.add('loader_hide');
      }, 500);
    })
    .catch(error => {
      // console.error('Ошибка при получении списка блюд:', error);
      alert(words[lang].appError)
    });



  //Функция рендера раздела категории
  function renderDishesCategoryList(dishesList) {
    const dishesCategoryListContainer = document.getElementById('dishesCategoryList');
    dishesCategoryListContainer.innerHTML = '';
    const addedCategories = new Set(); // Создаем множество для отслеживания добавенных категорий

    dishesList.forEach(dishitem => {
      if (dishitem.discount == 'yes' && !addedCategories.has("discount")) {
        const dishCategoryButton = document.createElement('button');
        dishCategoryButton.innerHTML = words[lang].discountButtonText;
        dishCategoryButton.addEventListener('click', () => {
          dishesCategoryListContainer.querySelector('button.button_active').classList.remove('button_active');
          dishCategoryButton.classList.add('button_active');
          renderDishesList('discount');
        });
        dishesCategoryListContainer.prepend(dishCategoryButton);
        addedCategories.add("discount");
      }
      if (dishitem.inStore == 'yes') {
        const category = dishitem[`${lang}Category`]; // Получаем категорию блюда

        // Проверяем, была ли категория уже добавлена
        if (!addedCategories.has(category)) {
          const dishCategoryButton = document.createElement('button');
          dishCategoryButton.innerHTML = `
              ${category}
          `;
          dishCategoryButton.addEventListener('click', () => {
            dishesCategoryListContainer.querySelector('button.button_active').classList.remove('button_active');
            dishCategoryButton.classList.add('button_active');
            renderDishesList(category);
          });
          dishesCategoryListContainer.appendChild(dishCategoryButton);
          addedCategories.add(category); // Добавляем категорию в множество
        }
      }

    });
    dishesCategoryListContainer.querySelector('button').classList.add('button_active');
    if (addedCategories.has("discount")) {
      renderDishesList("discount")
    } else {
      renderDishesList(storeData[0][`${lang}Category`]);
    }
  }


  //Функция рендера блюд выбранной категории
  function renderDishesList(category) {
    currentCategory = category;
    const dishesListContainer = document.getElementById('dishesList');
    dishesListContainer.classList.add('dishes-list_loading');
    setTimeout(() => {
      dishesListContainer.innerHTML = '';
      storeData.forEach(dishitem => {
        if ((dishitem[`${lang}Category`] === category && dishitem.inStore == 'yes') || (category == 'discount' && dishitem.discount == 'yes' && dishitem.inStore == 'yes')) {
          const dishCard = document.createElement('div');
          dishCard.dataset.id = dishitem.id;
          dishCard.classList.add('dishes-card');
          const imgSrc = dishitem.img ? dishitem.img : './img/samlesImg.png';
          dishCard.innerHTML = `
          <img src="${imgSrc}" alt="">
          <div class="dishes-card__info">
            <div class="dishes-card__description">
              <h2>${dishitem[`${lang}DishesName`]}</h2>
              <p class="dishes-card__description-text">${dishitem[`${lang}DishesDescription`]}</p>  
            </div>
          </div>
        `;

          // Порции
          const portionsContainer = document.createElement('div');
          portionsContainer.classList.add('dishes-card__portions');
          const portionNames = [dishitem.portionName1, dishitem.portionName2, dishitem.portionName3, dishitem.portionName4, dishitem.portionName5];
          portionNames.forEach((portionName, index) => {
            if (portionName) { // Проверяем, что название порции не пустое
              const portionNumber = basketList.find(item => item.dishId === `${dishitem.id}-${portionName}`)?.portionNumber || 0;
              if (portionNumber != 0) {
                dishCard.classList.add('dishes-card_active');
              }
              let portionInfoTex;
              let portionCostOld;
              let portionCost;
              if (dishitem.discount == 'yes') {
                portionCostOld = dishitem[`portionCost${index + 1}`];
                portionCost = dishitem[`portionCost${index + 1}Discount`];
                portionInfoTex = `<p class="portion-item__text"><span><span class="portion-name">${portionName}</span> - </span><span> <span class="portion-cost old">${portionCostOld}${globalData.currencySymbol}</span> <span class="portion-cost">${portionCost}${globalData.currencySymbol}</span></span></p>`
              } else {
                portionCost = dishitem[`portionCost${index + 1}`];
                portionInfoTex = `<p class="portion-item__text"><span><span class="portion-name">${portionName}</span> - </span><span> <span class="portion-cost">${portionCost}${globalData.currencySymbol}</span></span></p>`

              }
              const portionElement = document.createElement('div');
              portionElement.classList.add('portion-item');
              portionElement.innerHTML = `
                  ${portionInfoTex}
                  <div class="portion-item__buttons">
                    <button class="portion-minus"><i class="fa-solid fa-minus"></i></button>
                    <span class="portion-number">${portionNumber}</span>
                    <button class="portion-plus"><i class="fa-solid fa-plus"></i></button>
                  </div>
              `;
              const buttonPortionPlus = portionElement.querySelector('.portion-plus');
              buttonPortionPlus.addEventListener('click', () => {
                dishCard.classList.add('dishes-card_active');
                basketUpdate(dishitem[`${globalData.mainLang}Category`], 'plus', dishitem.id, dishitem[`${lang}DishesName`], dishitem[`${globalData.mainLang}DishesName`], portionName, portionCost, imgSrc, portionElement.querySelector('.portion-number'));
              });
              const buttonPortionMinus = portionElement.querySelector('.portion-minus');
              buttonPortionMinus.addEventListener('click', () => {
                basketUpdate(dishitem[`${globalData.mainLang}Category`], 'minus', dishitem.id, dishitem[`${lang}DishesName`], dishitem[`${globalData.mainLang}DishesName`], portionName, portionCost, imgSrc, portionElement.querySelector('.portion-number'));
              });
              portionsContainer.appendChild(portionElement);
            }
          });
          dishCard.appendChild(portionsContainer);
          // Порции закончились

          dishesListContainer.appendChild(dishCard);
        }
      });
      dishesListContainer.scrollLeft = 0;
      dishesListContainer.classList.remove('dishes-list_loading');
    }, 500);

  }

  //Функция обновления корзины
  function basketUpdate(category, action, dishId, dishName, dishNameMainLang, portionName, portionCost, dishImg, portionNumberSpan) {
    console.log(category, action, dishId, dishName, dishNameMainLang, portionName, portionCost, dishImg, portionNumberSpan);

    if (action === 'plus') {
      basketButtonOpen.classList.add('basket_have');
      portionNumberSpan.textContent = parseInt(portionNumberSpan.textContent) + 1;
      if (basketList.find(item => item.dishId === `${dishId}-${portionName}`)) {
        ;
        basketList = basketList.map(item => item.dishId === `${dishId}-${portionName}` ? { ...item, portionNumber: parseInt(portionNumberSpan.textContent), totalCost: portionCost * parseInt(portionNumberSpan.textContent) } : item);
      } else {
        basketList.push({
          mainLangCategory: category,
          dishIdCard: dishId,
          dishId: `${dishId}-${portionName}`,
          dishName: dishName,
          dishNameMainLang: dishNameMainLang,
          portionName: portionName,
          portionCost: portionCost,
          dishImg: dishImg,
          portionNumber: parseInt(portionNumberSpan.textContent),
          totalCost: portionCost,
          orderTime: '',
        });
      }
      sendOrderButton.disabled = false;
      sendOrderButton.classList.remove('_display_none');
    } else if (action === 'minus') {
      if (parseInt(portionNumberSpan.textContent) > 0) {
        portionNumberSpan.textContent = parseInt(portionNumberSpan.textContent) - 1;
        if (parseInt(portionNumberSpan.textContent) === 0) {
          basketList = basketList.filter(item => item.dishId !== `${dishId}-${portionName}`);
          if (!basketList.some(obj => obj.dishName === dishName)) {
            if (document.querySelector(`[data-id="${dishId}"]`)) {
              document.querySelector(`[data-id="${dishId}"]`).classList.remove('dishes-card_active');
            }
          }
          if (basketList.length === 0) {
            basketButtonOpen.classList.remove('basket_have');
            sendOrderButton.disabled = true;
            sendOrderButton.classList.add('_display_none');
          }

        } else {
          basketList = basketList.map(item => item.dishId === `${dishId}-${portionName}` ? { ...item, portionNumber: parseInt(portionNumberSpan.textContent), totalCost: portionCost * parseInt(portionNumberSpan.textContent) } : item);
        }
      }

    }
    renderBasketList();
  }

  //Функция рендера корзины
  function renderBasketList() {
    const basketListContainer = document.getElementById('basketList');
    basketListContainer.innerHTML = '';
    let totalCost = 0;
    basketList.forEach(item => {
      const basketItem = document.createElement('div');
      basketItem.classList.add('basket-item');
      basketItem.dataset.id = item.dishId;
      basketItem.innerHTML = `
    <div class="basket-item__img">
      <img src="${item.dishImg}" alt="">
      <div class="basket-item__manage">
        <div class="basket-item__buttons">
          <button class="portion-minus"><i class="fa-solid fa-minus"></i></button>
          <span class="portion-number">${item.portionNumber}</span>
          <button class="portion-plus"><i class="fa-solid fa-plus"></i></button>
        </div>
        <p class="basket-item__total-cost">${item.totalCost}${globalData.currencySymbol}</p>
      </div>
    </div>
    <div class="basket-item__info">
      <h3>${item.dishName}</h3>
      <h4>${item.dishNameMainLang} (${item.mainLangCategory})</h4>
      <p><span class="portion-name">${item.portionName} - </span><span> <span class="portion-cost">${item.portionCost}${globalData.currencySymbol}</span></span></p>
      
    </div>
    `;
      const buttonPortionPlus = basketItem.querySelector('.portion-plus');
      buttonPortionPlus.addEventListener('click', () => {
        basketUpdate(item[`${globalData.mainLang}Category`], 'plus', item.dishId.split('-')[0], item.dishName, item.dishNameMainLang, item.portionName, item.portionCost, item.dishImg, basketItem.querySelector('.portion-number'));
        renderDishesList(currentCategory);
      });
      const buttonPortionMinus = basketItem.querySelector('.portion-minus');
      buttonPortionMinus.addEventListener('click', () => {
        basketUpdate(item[`${globalData.mainLang}Category`], 'minus', item.dishId.split('-')[0], item.dishName, item.dishNameMainLang, item.portionName, item.portionCost, item.dishImg, basketItem.querySelector('.portion-number'));
        renderDishesList(currentCategory);
      });
      basketListContainer.appendChild(basketItem);
      totalCost += item.totalCost;
    });
    document.getElementById('totalCost').innerHTML = `${words[lang].totalCost} <span>${totalCost}${globalData.currencySymbol}</span>`;
    saveDataToLocal();
  }

  //Отправка Заказа с сайта
  sendOrderButton.addEventListener('click', sendOrder);
  async function sendOrder() {
    sendOrderButton.disabled = true;
    let orderDishesLit = '';
    let orderTotolCost = '';
    if (tableNumber == '' || tableNumber === null) {
      dialogBoxAppears('inpitTableNumber');
      sendOrderButton.disabled = false;
      return
    }
    if (orderId == '') {
      orderId = createOrderId();
    }
    yourOrderButton.innerHTML = `${words[lang].yourOrderButton} ${orderId}`;
    let totalCostMessage = 0;
    let orderMessage = `${words[globalData.mainLang].newOrderMessage}\n${words[globalData.mainLang].visitorNnativeLanguage}${lang}\n${words[globalData.mainLang].tableNumber}${tableNumber}\n${words[globalData.mainLang].orderNumber}\n\`${orderId}\`\n`;

    let portionNumberMessage = 0;

    if (ordersList.length > 0) {
      orderMessage = `${words[globalData.mainLang].updateOrderMessage}\n${words[globalData.mainLang].visitorNnativeLanguage}${lang}\n${words[globalData.mainLang].tableNumber}${tableNumber}\n${words[globalData.mainLang].orderNumber}\n\`${orderId}\`\n`;
      orderMessage += `\n\n${words[globalData.mainLang].oldDishes}\n`;
      ordersList.forEach(item => {
        portionNumberMessage += 1;
        orderDishesLit += `${portionNumberMessage}. ${item.dishName} ${item.mainLangCategory}   `;
        orderMessage += `\n${portionNumberMessage}. ${item.dishNameMainLang} (${item.mainLangCategory}) - ${item.portionName} x ${item.portionNumber} = ${item.totalCost}${globalData.currencySymbol}\n${item.dishName}\n`;
        totalCostMessage += item.totalCost;
      });
      orderMessage += `\n ------------------- \n`;
      orderMessage += `\n${words[globalData.mainLang].newDishes}\n`;
    } else {
      orderMessage += `\n${words[globalData.mainLang].listDishes}\n`;
    }

    basketList.forEach(item => {
      portionNumberMessage += 1;
      orderDishesLit += `${portionNumberMessage}. ${item.dishName} (${item.mainLangCategory})  `;
      orderMessage += `\n${portionNumberMessage}. ${item.dishNameMainLang} (${item.mainLangCategory}) - ${item.portionName} x ${item.portionNumber} = ${item.totalCost}${globalData.currencySymbol}\n${item.dishName}\n`;
      totalCostMessage += item.totalCost;
    });

    orderMessage += `\n\n💰 ${words[globalData.mainLang].totalCostOrder}  ${totalCostMessage}${globalData.currencySymbol}`;
    orderTotolCost = `${totalCostMessage}${globalData.currencySymbol}`;


    const apiUrl = `https://api.telegram.org/bot${globalData.botToken}/sendMessage`;
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: globalData.chatId,
        text: orderMessage,
        parse_mode: 'Markdown',
      }),
    })

      .then(response => response.json())
      .then(data => {
        if (data.ok) {
          dialogBoxAppears('info', `${words[lang].textSendOrder}`);

        } else {
          dialogBoxAppears('info', `${words[lang].textErrorSendOrder}`);
        }
      })
    sendOrderButton.disabled = false;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0'); // Часы
    const minutes = String(now.getMinutes()).padStart(2, '0'); // Минуты
    const orderTime = `${hours}:${minutes}`;
    basketList.forEach(item => {
      item.orderTime = orderTime;
      ordersList.unshift(item);
    });
    basketList = [];

    renderBasketList();
    renderDishesCategoryList(storeData);
    renderDishesList(storeData[0][`${lang}Category`]);
    renderOrderList();
    saveDataToLocal();
  }

  // Функция для отправки закза в google form заказа

  async function sendStatisticToForm(orderId, lang, tableNumber, client, orderDishesLit, orderTotolCost, type) {
    const formData = new FormData();

    // Динамически заполняем данные, используя соответствие inputId → name
    formData.append(globalData.inputNames.inputOrderId, orderId);
    formData.append(globalData.inputNames.inputLangOrderTable, lang);
    formData.append(globalData.inputNames.inputTableNumberOrderTable, tableNumber);
    formData.append(globalData.inputNames.inputVisitorTypeOrderTable, client);
    formData.append(globalData.inputNames.inputDishesOrderTable, orderDishesLit);
    formData.append(globalData.inputNames.inputTotolCostOrderTable, orderTotolCost);
    formData.append(globalData.inputNames.inputType, type);

    const formUrl = globalData.fotmAction;

    let success = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!success && attempts < maxAttempts) {
      try {
        const response = await fetch(formUrl, {
          method: "POST",
          body: formData,
          mode: "no-cors",
        });

        success = true;
      } catch (error) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      };
    };
  };

  // Функция для рендеренга заказа
  function renderOrderList() {

    let totalCost = 0;
    const orderListDiv = document.querySelector('.order-list');
    orderListDiv.innerHTML = '';
    ordersList.forEach(item => {
      const cardItem = document.createElement('div');
      cardItem.classList.add('basket-item');
      cardItem.dataset.id = item.dishId;
      cardItem.innerHTML = `
      <div class="basket-item__img">
        <img src="${item.dishImg}" alt="">
        <div class="basket-item__manage">
          <div class="basket-item__buttons">
            <span class="portion-number">${item.portionNumber}</span>
          </div>
          <p class="basket-item__total-cost">${item.totalCost}${globalData.currencySymbol}</p>
        </div>
      </div>
      <div class="basket-item__info">
        <h3>${item.dishName}</h3>
        <h4>${item.dishNameMainLang} (${item.mainLangCategory})</h4>
        <p><span class="portion-name">${item.portionName} - </span><span> <span class="portion-cost">${item.portionCost}${globalData.currencySymbol}</span></span></p>
        
      </div>
      <span class='orderTime'>${item.orderTime}</span>
      `;
      totalCost += item.totalCost;
      orderListDiv.appendChild(cardItem);
    });
    document.querySelector('#totalCostOrder').innerHTML = `${words[lang].totalCostOrder} <br> <span>${totalCost} ${globalData.currencySymbol}</span>`;
    mainResetAfterSendOrder();
    saveDataToLocal();
  };

  function mainResetAfterSendOrder() {
    basketButtonOpen.classList.remove('basket_have');
    sendOrderButton.disabled = true;
    sendOrderButton.classList.add('_display_none');
    sendOrderButton.innerText = `${words[lang].updateOrder}`;
    yourOrderButton.classList.add('_active');
    yourOrderButton.classList.remove('_display_none');
  };





  //Функция создания id заказа
  function createOrderId() {
    const now = new Date();

    // Форматируем значения
    const day = String(now.getDate()).padStart(2, '0'); // День
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Месяц
    const year = now.getFullYear(); // Год
    const hours = String(now.getHours()).padStart(2, '0'); // Часы
    const minutes = String(now.getMinutes()).padStart(2, '0'); // Минуты
    const seconds = String(now.getSeconds()).padStart(2, '0'); // Секунды

    // Объединяем результат
    const result = `${day}.${month}.${year}_${hours}:${minutes}:${seconds}-${tableNumber}`;
    return result;
  };


  //Функция сохранения данных
  function saveDataToLocal() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0'); // День
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Месяц
    const year = now.getFullYear(); // Год
    const date = `${day}.${month}.${year}`;
    const hours = String(now.getHours()).padStart(2, '0'); // Часы
    const minutes = String(now.getMinutes()).padStart(2, '0'); // Минуты
    const userData = {
      userTableNumber: tableNumber,
      userOrderList: ordersList,
      userBascketList: basketList,
      userOrderID: orderId,
      datelastVisit: date,
    };
    localStorage.setItem(`userData-${globalData.cafeName}`, JSON.stringify(userData))
  }
}