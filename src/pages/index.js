import "./index.css";
import {
  enableValidation,
  resetValidation,
  disabledButton,
  settings,
} from "../scripts/validation.js";
import Api from "../utils/Api.js";
import { setButtonText } from "../utils/helpers.js";

const api = new Api({
  baseUrl: "https://around-api.en.tripleten-services.com/v1",
  headers: {
    authorization: "e465f05e-9b11-4869-9d31-ca0f853157cf",
    "Content-Type": "application/json",
  },
});

let currentUserId;

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
    profileAvatar.alt = `${userData.name}'s avatar`;

    cards.forEach((cardData) => {
      const cardEl = getCardElement(cardData);
      cardsList.append(cardEl);
    });
  })
  .catch((error) => {
    console.error("API error:", error);
  });

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
      evt.target.classList.contains("modal__submit-btn_type_cancel") ||
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

  if (data._id) {
    cardLikeBtn.addEventListener("click", () =>
      handleLike(cardLikeBtn, data._id)
    );
    cardDeleteBtn.addEventListener("click", () =>
      handleDeleteCard(cardElement, data._id)
    );
  }

  cardImageEl.addEventListener("click", () => {
    openModal(previewModal);
    previewModalImageEl.src = data.link;
    previewModalImageEl.alt = data.name;
    previewModalCaptionEl.textContent = data.name;
  });

  return cardElement;
}

function handleLike(likeButton, cardId) {
  const isLiked = likeButton.classList.contains("card__like-btn_active");

  api
    .changeLikeCardStatus(cardId, !isLiked)
    .then((response) => {
      const liked = response.isLiked;
      if (liked) {
        likeButton.classList.add("card__like-btn_active");
      } else {
        likeButton.classList.remove("card__like-btn_active");
      }
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
  const btn = evt.submitter;
  setButtonText(btn, true, "Delete", "Deleting...");

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
      setButtonText(btn, false, "Delete", "Deleting...");
    });
}

function handleEditFormSubmit(evt) {
  evt.preventDefault();
  const btn = evt.submitter;
  setButtonText(btn, true, "Save", "Saving...");

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
      setButtonText(btn, false, "Save", "Saving...");
    });
}

function handleAvatarCardSubmit(evt) {
  evt.preventDefault();
  const submitBtn = evt.submitter;
  setButtonText(submitBtn, true, "Save", "Saving...");

  return api
    .editAvatarInfo(avatarInput.value)
    .then((data) => {
      console.log("Avatar API response:", data);
      console.log("Setting avatar src to:", data.avatar);
      console.log("Profile avatar element:", profileAvatar);
      profileAvatar.src = data.avatar;
      profileAvatar.alt = `${data.name}'s avatar`;
      avatarFormElement.reset();
      closeModal(avatarModal);
    })
    .catch(console.error)
    .finally(() => {
      setButtonText(submitBtn, false, "Save", "Saving...");
    });
}

function handleAddCardSubmit(evt) {
  evt.preventDefault();
  const btn = evt.submitter;
  setButtonText(btn, true, "Create", "Creating...");

  api
    .createCard({
      name: cardNameInput.value,
      link: cardLinkInput.value,
    })
    .then((card) => {
      cardsList.prepend(getCardElement(card));
      cardForm.reset();
      closeModal(cardModal);
    })
    .catch(console.error)
    .finally(() => {
      setButtonText(btn, false, "Create", "Creating...");
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
