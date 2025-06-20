import "./index.css";
import {
  enableValidation,
  resetValidation,
  disabledButton,
  settings,
} from "../scripts/validation.js";
import Api from "../utils/Api.js";
import { setButtonText } from "../utils/helpers.js";

// Initial cards for backup rendering if API fails (optional)
const initialCards = [
  {
    name: "Val Thorens",
    link: "https://practicum-content.s3.us-west-1.amazonaws.com/software-engineer/spots/1-photo-by-moritz-feldmann-from-pexels.jpg",
  },
  {
    name: "Restaurant terrace",
    link: "https://practicum-content.s3.us-west-1.amazonaws.com/software-engineer/spots/2-photo-by-ceiline-from-pexels.jpg",
  },
  {
    name: "An outdoor cafe",
    link: "https://practicum-content.s3.us-west-1.amazonaws.com/software-engineer/spots/3-photo-by-tubanur-dogan-from-pexels.jpg",
  },
  {
    name: "A very long bridge, over the forest and through the trees",
    link: "https://practicum-content.s3.us-west-1.amazonaws.com/software-engineer/spots/4-photo-by-maurice-laschet-from-pexels.jpg",
  },
  {
    name: "Tunnel with morning light",
    link: "https://practicum-content.s3.us-west-1.amazonaws.com/software-engineer/spots/5-photo-by-van-anh-nguyen-from-pexels.jpg",
  },
  {
    name: "Mountain house",
    link: "https://practicum-content.s3.us-west-1.amazonaws.com/software-engineer/spots/6-photo-by-moritz-feldmann-from-pexels.jpg",
  },
];

const api = new Api({
  baseUrl: "https://around-api.en.tripleten-services.com/v1",
  headers: {
    authorization: "e465f05e-9b11-4869-9d31-ca0f853157cf",
    "Content-Type": "application/json",
  },
});

let currentUserId;

// DOM Elements
const profileEditButton = document.querySelector(".profile__edit-btn");
const cardButton = document.querySelector(".profile__add-btn");
const avatarButton = document.querySelector(".profile__avatar-btn");

const profileName = document.querySelector(".profile__name");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__avatar");

const editModal = document.querySelector("#edit-modal");
const editFormElement = editModal.querySelector(".modal__form");
const editModalNameInput = editModal.querySelector("#profile-name-input");
const editModalDescriptionInput = editModal.querySelector(
  "#profile-description-input"
);

const avatarModal = document.querySelector("#avatar-modal");
const avatarFormElement = avatarModal.querySelector(".modal__form");
const avatarInput = avatarModal.querySelector("#profile-avatar-input");

const deleteModal = document.querySelector("#delete-modal");
const deleteForm = deleteModal.querySelector("#delete-form");

const cardModal = document.querySelector("#add-card-modal");
const cardForm = cardModal.querySelector(".modal__form");
const cardSubmitBtn = cardModal.querySelector(".modal__submit-btn");
const cardNameInput = cardModal.querySelector("#add-card-name-input");
const cardLinkInput = cardModal.querySelector("#add-card-link-input");

const previewModal = document.querySelector("#preview-modal");
const previewModalImageEl = previewModal.querySelector(".modal__image");
const previewModalCaptionEl = previewModal.querySelector(".modal__caption");

const cardTemplate = document.querySelector("#card-template");
const cardsList = document.querySelector(".cards__list");
const modals = document.querySelectorAll(".modal");

let selectedCard, selectedCardId;

Promise.all([api.getUserInfo(), api.getInitialCards()])
  .then(([userData, cards]) => {
    currentUserId = userData._id;
    profileName.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.src = userData.avatar;

    cards.forEach((cardData) => {
      const cardEl = getCardElement(cardData);
      cardsList.append(cardEl);
    });
  })
  .catch(console.error);

function openModal(modal) {
  modal.classList.add("modal_opened");
  document.addEventListener("keyup", handleEscape);
}

function closeModal(modal) {
  modal.classList.remove("modal_opened");
  document.removeEventListener("keyup", handleEscape);
}

function handleEscape(evt) {
  if (evt.key === "Escape") {
    const activeModal = document.querySelector(".modal_opened");
    closeModal(activeModal);
  }
}

modals.forEach((modal) => {
  modal.addEventListener("mousedown", (evt) => {
    if (
      evt.target.classList.contains("modal") ||
      evt.target.classList.contains("modal__close-btn")
    ) {
      closeModal(modal);
    }
  });
});

function getCardElement(data) {
  const cardElement = cardTemplate.content
    .querySelector(".card")
    .cloneNode(true);
  const cardNameEl = cardElement.querySelector(".card__title");
  const cardImageEl = cardElement.querySelector(".card__image");
  const cardLikeBtn = cardElement.querySelector(".card__like-btn");
  const cardDeleteBtn = cardElement.querySelector(".card__delete");

  cardNameEl.textContent = data.name;
  cardImageEl.src = data.link;
  cardImageEl.alt = data.name;

  if (data.likes && data.likes.some((user) => user._id === currentUserId)) {
    cardLikeBtn.classList.add("card__like-btn_active");
  }

  cardLikeBtn.addEventListener("click", (evt) => handleLike(evt, data._id));

  cardDeleteBtn.addEventListener("click", () => {
    handleDeleteCard(cardElement, data._id);
  });

  cardImageEl.addEventListener("click", () => {
    openModal(previewModal);
    previewModalImageEl.src = data.link;
    previewModalImageEl.alt = data.name;
    previewModalCaptionEl.textContent = data.name;
  });

  return cardElement;
}

function handleLike(evt, id) {
  const likeButton = evt.target;
  const isLiked = likeButton.classList.contains("card__like-btn_active");

  api
    .changeLikeCardStatus(id, !isLiked)
    .then(() => {
      likeButton.classList.toggle("card__like-btn_active", !isLiked);
    })
    .catch((error) => {
      console.error("Failed to update like status", error);
    });
}

function handleDeleteCard(cardElement, cardId) {
  selectedCard = cardElement;
  selectedCardId = cardId;
  openModal(deleteModal);
}

function handleDeleteSubmit(evt) {
  evt.preventDefault();
  const submitBtn = evt.submitter;
  setButtonText(submitBtn, true, "Deleting...", "Delete");

  api
    .deleteCard(selectedCardId)
    .then(() => {
      selectedCard.remove();
      closeModal(deleteModal);
    })
    .catch((error) => {
      console.error("Failed to delete card", error);
    })
    .finally(() => {
      setButtonText(submitBtn, false, "Deleting...", "Delete");
    });
}
function handleEditFormSubmit(evt) {
  evt.preventDefault();
  const submitBtn = evt.submitter;
  setButtonText(submitBtn, true, "Saving...", "Save");

  api
    .editUserInfo({
      name: editModalNameInput.value,
      about: editModalDescriptionInput.value,
    })
    .then((data) => {
      profileName.textContent = data.name;
      profileDescription.textContent = data.about;
      closeModal(editModal);
    })
    .catch(console.error)
    .finally(() => {
      setButtonText(submitBtn, false, "Saving...", "Save");
    });
}

function handleAvatarCardSubmit(evt) {
  evt.preventDefault();
  const submitBtn = evt.submitter;
  setButtonText(submitBtn, true, "Saving...", "Save");

  api
    .editAvatarInfo(avatarInput.value)
    .then((data) => {
      profileAvatar.src = data.avatar;
      avatarFormElement.reset();
      closeModal(avatarModal);
    })
    .catch(console.error)
    .finally(() => {
      setButtonText(submitBtn, false, "Saving...", "Save");
    });
}

function handleAddCardSubmit(evt) {
  evt.preventDefault();
  const name = cardNameInput.value;
  const link = cardLinkInput.value;

  setButtonText(cardSubmitBtn, true, "Saving...", "Save");

  api
    .createCard({ name, link })
    .then((data) => {
      const cardEl = getCardElement(data);
      cardsList.prepend(cardEl);
      cardForm.reset();
      closeModal(cardModal);
      disabledButton(cardSubmitBtn, settings);
    })
    .catch(console.error)
    .finally(() => {
      setButtonText(cardSubmitBtn, false, "Saving...", "Save");
    });
}

profileEditButton.addEventListener("click", () => {
  editModalNameInput.value = profileName.textContent;
  editModalDescriptionInput.value = profileDescription.textContent;
  resetValidation(
    editFormElement,
    [editModalNameInput, editModalDescriptionInput],
    settings
  );
  openModal(editModal);
});

cardButton.addEventListener("click", () => {
  cardForm.reset();
  resetValidation(cardForm, [cardNameInput, cardLinkInput], settings);
  openModal(cardModal);
});

avatarButton.addEventListener("click", () => {
  avatarFormElement.reset();
  resetValidation(avatarFormElement, [avatarInput], settings);
  openModal(avatarModal);
});

editFormElement.addEventListener("submit", handleEditFormSubmit);
avatarFormElement.addEventListener("submit", handleAvatarCardSubmit);
cardForm.addEventListener("submit", handleAddCardSubmit);
deleteForm.addEventListener("submit", handleDeleteSubmit);

enableValidation(settings);
