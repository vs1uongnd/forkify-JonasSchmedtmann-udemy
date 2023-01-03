import * as model from './model.js';
import { MODAL_CLOSE_SEC } from './config.js';
import recipeView from './views/recipeView.js';
import searchView from './views/searchView.js';
import resultsView from './views/resultsView.js';
import paginationView from './views/paginationView.js';
import bookmarksView from './views/bookmarksView.js';
import addRecipeView from './views/addRecipeView.js';

import 'core-js';
import 'regenerator-runtime';
import { async } from 'regenerator-runtime';

// https://forkify-api.herokuapp.com/v2

///////////////////////////////////////

// if (module.hot) {
//   module.hot.accept();
// }

const controlRecipes = async function () {
  try {
    const id = window.location.hash.slice(1);
    if (!id) return;
    recipeView.renderSpinner();

    // 1. Update results view to mark selected search result
    // (tương tự khi ta update servings, thì ta chỉ muốn update ở các nơi của DOM có sự thay đổi. Ví dụ: Rõ ràng là Image không thay đổi, thì không cần update lại (tải lại).)
    // Ở đây cũng thế: khi ta click vào các results view, thì result nào được chọn sẽ thêm class='preview__link--active'. Nó chỉ có sự thay đổi duy nhất về màu background, và ta không muốn Image cũng được update lại (tải lại)
    // Nên ta dùng hàm update()
    resultsView.update(model.getSearchResultsPage());

    // 2. Update bookmarks view
    bookmarksView.update(model.state.bookmarks);

    // 3. Loading recipe
    await model.loadRecipe(id);

    // 4. Rendering recipe
    recipeView.render(model.state.recipe);
  } catch (err) {
    console.error(err);
    recipeView.renderError();
  }
};

const controlSearchResults = async function () {
  try {
    // 1. Get search query
    const query = searchView.getQuery();
    if (!query) return;

    // 2. Load search results
    await model.loadSearchResults(query);

    // 3. Rendering search results
    // resultsView.render(model.state.search.results);
    resultsView.render(model.getSearchResultsPage());

    // 4. Render initial pagination buttons
    paginationView.render(model.state.search);
  } catch (err) {
    // console.error(err);
  }
};

const controlPagination = function (goToPage) {
  // console.log(goToPage);
  // 1.  Rendering NEW search results
  resultsView.render(model.getSearchResultsPage(goToPage));

  // 2. Render NEW initial pagination buttons
  paginationView.render(model.state.search);
};

const controlServings = function (newServings) {
  // Update the recipe servings (in state)
  model.updateServings(newServings);
  // Update the recipe view
  // recipeView.render(model.state.recipe);
  // Khi ta update servings, thì ta chỉ muốn update ở các nơi của DOM có sự thay đổi. Ví dụ: Rõ ràng là Image không thay đổi, thì không cần update lại (tải lại).
  recipeView.update(model.state.recipe);
};

const controlAddBookmark = function () {
  // 1. Add or remove bookmark
  if (!model.state.recipe.bookmarked) model.addBookmark(model.state.recipe);
  else {
    model.deleteBookmark(model.state.recipe.id);
  }

  // 2. Update recipe view
  recipeView.update(model.state.recipe);

  // 3. Render bookmarks
  bookmarksView.render(model.state.bookmarks);
};

const controlBookmarks = function () {
  bookmarksView.render(model.state.bookmarks);
};

const controlAddRecipe = async function (newRecipe) {
  try {
    // Show loading spinner
    addRecipeView.renderSpinner();

    // Upload the new recipe
    await model.uploadRecipe(newRecipe);
    console.log(model.state.recipe);

    // Render recipe
    recipeView.render(model.state.recipe);

    // Success message
    addRecipeView.renderMessage();

    // Render bookmarks view
    bookmarksView.render(model.state.bookmarks);

    // Change ID in Url
    window.history.pushState(null, '', `#${model.state.recipe.id}`);

    // Close form window
    const wait = function (seconds) {
      return new Promise(function (resolve) {
        setTimeout(() => resolve(), seconds * 1000);
      });
    };

    wait(MODAL_CLOSE_SEC)
      .then(() => {
        addRecipeView.hideWindow();
        return wait(1);
      })
      .then(() => addRecipeView.addFormComeBack());
  } catch (err) {
    console.error('❌', err);
    addRecipeView.renderError(err.message);
  }
};

const init = function () {
  bookmarksView.addHandlerRender(controlBookmarks);
  recipeView.addHandlerRender(controlRecipes);
  recipeView.addHandlerUpdateServings(controlServings);
  recipeView.addHandlerAddBookmark(controlAddBookmark);
  searchView.addHandlerSearch(controlSearchResults);
  paginationView.addHandlerClick(controlPagination);
  addRecipeView.addHandlerUpload(controlAddRecipe);
};

init();
