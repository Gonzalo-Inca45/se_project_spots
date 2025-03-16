const settings = {
  formSelector: ".modal__form",
  inputSelector: ".modal__input",
  submitButtonSelector: ".modal__submit-btn",
  inactiveButtonClass: "modal__button_disabled",
  inputErrorClass: "modal__input_type_error",
  errorClass: "modal__error_visible",
};

const showInputError = (formEl, inputEl, errorMsg, config) => {
  const erorrMsgID = inputEl.id + "-error";
  const errorMsgEl = formEl.querySelector("#" + erorrMsgID);
  errorMsgEl.textContent = errorMsg;
  inputEl.classList.add("modal__input_type_error");
};

const hideInputError = (formEl, inputEl, errorMsg) => {
  const erorrMsgID = inputEl.id + "-error";
  const errorMsgEl = formEl.querySelector("#" + erorrMsgID);
  errorMsgEl.textContent = errorMsg;
};

const checkInputValidity = (formEl, inputEl) => {
  if (!inputEl.validity.valid) {
    showInputError(formEl, inputEl, inputEl.validationMessage);
  } else {
    hideInputError(formEl, inputEl);
  }
};

const hasInvalidInput = (inputList) => {
  return inputList.every((input) => input.validity.valid);
};

const toggleButtonState = (inputList, buttonEl, config) => {
  if (!hasInvalidInput(inputList)) {
    console.log("its not valid");
    disabledButton(buttonEl, config);
  } else {
    console.log("its vlaid");
    buttonEl.disabled = false;
    //remove disabled class
    buttonEl.classList.remove(config.inactiveButtonClass);
  }
};

const disabledButton = (buttonEl, config) => {
  buttonEl.disabled = true;
  //add a modifier class to the buttonEL to make grey
  //and CSS
  buttonEl.classList.add(config.inactiveButtonClass);
};

const resetValidation = (formEl, inputList, config) => {
  inputList.forEach((input) => {
    hideInputError(formEl, input);
  });
  toggleButtonState(
    inputList,
    formEl.querySelector(config.submitButtonSelector),
    config
  );
};

//use the settings object in all functions instead of hard-coded strings

const setEventListeners = (formEl, config) => {
  const inputList = Array.from(formEl.querySelectorAll(config.inputSelector));
  const buttonElement = formEl.querySelector(config.submitButtonSelector);

  inputList.forEach((inputElement) => {
    inputElement.addEventListener("input", function () {
      checkInputValidity(formEl, inputElement, config);
      toggleButtonState(inputList, buttonElement, config);
    });
  });
};
const enableValidation = (config) => {
  const formList = document.querySelectorAll(config.formSelector);
  formList.forEach((formEl) => {
    setEventListeners(formEl, config);
  });
};

enableValidation(settings);
