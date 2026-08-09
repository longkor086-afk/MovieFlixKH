/* =========================================================
   MovieFlixKH - Frontend Application
   ========================================================= */

/*
 * IMPORTANT:
 * Put your current Cloudflare Tunnel URL here.
 *
 * Example:
 * const API_URL = "https://example.trycloudflare.com";
 *
 * Do NOT add /movies at the end.
 */
const API_URL = "https://importantly-marriage-meant-events.trycloudflare.com";


/* =========================================================
   APP STATE
   ========================================================= */

let movies = [];
let filteredMovies = [];
let selectedMovie = null;
let selectedCategory = "all";
let searchQuery = "";
let toastTimer = null;


/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = (selector) => document.querySelector(selector);

const elements = {
    header: $("#header"),
    mainNavigation: $("#mainNavigation"),
    menuToggle: $("#menuToggle"),
    headerSearchButton: $("#headerSearchButton"),

    searchInput: $("#searchInput"),
    clearSearchButton: $("#clearSearchButton"),

    hero: $("#hero"),
    heroBackdrop: $("#heroBackdrop"),
    heroTitle: $("#heroTitle"),
    heroYear: $("#heroYear"),
    heroGenre: $("#heroGenre"),
    heroQuality: $("#heroQuality"),
    heroRating: $("#heroRating"),
    heroDescription: $("#heroDescription"),
    heroWatchButton: $("#heroWatchButton"),
    heroInfoButton: $("#heroInfoButton"),

    categoryContainer: $("#categoryContainer"),
    movieGrid: $("#movieGrid"),
    loading: $("#loading"),
    error: $("#error"),
    emptyState: $("#emptyState"),
    retryButton: $("#retryButton"),
    viewAllButton: $("#viewAllButton"),

    genreGrid: $("#genreGrid"),

    playerModal: $("#playerModal"),
    closePlayerButton: $("#closePlayerButton"),
    playerMovieTitle: $("#playerMovieTitle"),
    videoPlayer: $("#videoPlayer"),
    videoLoading: $("#videoLoading"),

    movieDetails: $("#movieDetails"),
    detailsTitle: $("#detailsTitle"),
    detailsMeta: $("#detailsMeta"),
    detailsRating: $("#detailsRating"),
    detailsDescription: $("#detailsDescription"),
    detailsYear: $("#detailsYear"),
    detailsCountry: $("#detailsCountry"),
    detailsGenre: $("#detailsGenre"),
    detailsDuration: $("#detailsDuration"),
    detailsQuality: $("#detailsQuality"),
    detailsLanguage: $("#detailsLanguage"),
    detailsSubtitle: $("#detailsSubtitle"),

    downloadButton: $("#downloadButton"),
    shareButton: $("#shareButton"),

    infoModal: $("#infoModal"),
    closeInfoButton: $("#closeInfoButton"),
    infoModalBody: $("#infoModalBody"),

    toast: $("#toast"),
    toastIcon: $("#toastIcon"),
    toastMessage: $("#toastMessage"),

    footerRetryButton: $("#footerRetryButton"),
    currentYear: $("#currentYear")
};


/* =========================================================
   STARTUP
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
});


function initializeApp() {

    if (elements.currentYear) {
        elements.currentYear.textContent = new Date().getFullYear();
    }

    bindEvents();

    if (!isValidApiUrl()) {
        showConfigurationMessage();
        return;
    }

    loadMovies();
}


/* =========================================================
   API
   ========================================================= */

function isValidApiUrl() {
    return (
        typeof API_URL === "string" &&
        API_URL.trim() !== "" &&
        !API_URL.includes("YOUR-API-URL")
    );
}


function getApiUrl(path = "") {
    const base = API_URL.replace(/\/+$/, "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${base}${cleanPath}`;
}


async function fetchMovies() {

    const response = await fetch(getApiUrl("/movies"), {
        method: "GET",
        headers: {
            "Accept": "application/json"
        },
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(`Movies API returned ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
        if (Array.isArray(data.movies)) {
            return data.movies;
        }

        throw new Error("Invalid movies response");
    }

    return data;
}


/* =========================================================
   LOAD MOVIES
   ========================================================= */

async function loadMovies() {

    showLoading();

    try {

        movies = await fetchMovies();

        movies = movies.filter(movie => {
            return movie && typeof movie === "object";
        });

        filteredMovies = [...movies];

        hideLoading();
        hideError();

        if (movies.length === 0) {
            showEmpty();
            setDefaultHero();
            return;
        }

        hideEmpty();

        renderMovies();
        setFeaturedMovie(movies[0]);

    } catch (error) {

        console.error("MovieFlixKH API Error:", error);

        hideLoading();
        showError();

        if (movies.length === 0) {
            setDefaultHero();
        }
    }
}


/* =========================================================
   MOVIE FILTERING
   ========================================================= */

function applyFilters() {

    const query = searchQuery.trim().toLowerCase();

    filteredMovies = movies.filter(movie => {

        const matchesCategory =
            selectedCategory === "all" ||
            movieHasGenre(movie, selectedCategory);

        if (!matchesCategory) {
            return false;
        }

        if (!query) {
            return true;
        }

        const searchableText = [
            movie.title,
            movie.description,
            movie.country,
            movie.year,
            movie.language,
            movie.subtitle,
            ...(Array.isArray(movie.genre) ? movie.genre : [])
        ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

        return searchableText.includes(query);
    });

    renderMovies();

    if (filteredMovies.length === 0) {
        showEmpty("រកមិនឃើញភាពយន្តដែលអ្នកកំពុងស្វែងរកទេ");
    } else {
        hideEmpty();
    }
}


function movieHasGenre(movie, category) {

    if (!Array.isArray(movie.genre)) {
        return false;
    }

    const target = String(category).trim().toLowerCase();

    return movie.genre.some(genre => {
        return String(genre).trim().toLowerCase() === target;
    });
}


/* =========================================================
   RENDER MOVIES
   ========================================================= */

function renderMovies() {

    if (!elements.movieGrid) {
        return;
    }

    elements.movieGrid.innerHTML = "";

    filteredMovies.forEach(movie => {

        const card = createMovieCard(movie);

        elements.movieGrid.appendChild(card);
    });
}


function createMovieCard(movie) {

    const article = document.createElement("article");

    article.className = "movie-card";

    article.tabIndex = 0;

    const poster = document.createElement("div");
    poster.className = "movie-poster";

    const posterUrl = getPosterUrl(movie);

    if (posterUrl) {

        const image = document.createElement("img");

        image.src = posterUrl;
        image.alt = movie.title || "Movie poster";
        image.loading = "lazy";
        image.decoding = "async";

        image.onerror = () => {
            image.remove();
            poster.appendChild(createPosterPlaceholder());
        };

        poster.appendChild(image);

    } else {

        poster.appendChild(createPosterPlaceholder());
    }


    if (movie.quality) {

        const quality = document.createElement("span");

        quality.className = "movie-quality";
        quality.textContent = movie.quality;

        poster.appendChild(quality);
    }


    if (hasRating(movie)) {

        const rating = document.createElement("span");

        rating.className = "movie-rating";
        rating.textContent = `⭐ ${formatRating(movie.rating)}`;

        poster.appendChild(rating);
    }


    const body = document.createElement("div");

    body.className = "movie-card-body";


    const title = document.createElement("h3");

    title.className = "movie-title";
    title.textContent = safeText(movie.title, "Unknown Movie");


    const meta = document.createElement("div");

    meta.className = "movie-meta";

    if (movie.year) {
        addMetaItem(meta, movie.year);
    }

    if (movie.duration) {
        addMetaItem(meta, movie.duration);
    }


    const genre = document.createElement("div");

    genre.className = "movie-genre";

    genre.textContent = getGenreText(movie);


    const watchButton = document.createElement("button");

    watchButton.type = "button";
    watchButton.className = "movie-card-action";
    watchButton.textContent = "▶️ Watch";
    watchButton.setAttribute(
        "aria-label",
        `មើល ${safeText(movie.title, "ភាពយន្ត")}`
    );


    watchButton.addEventListener("click", event => {

        event.stopPropagation();

        openPlayer(movie);
    });


    body.appendChild(title);
    body.appendChild(meta);

    if (genre.textContent) {
        body.appendChild(genre);
    }

    body.appendChild(watchButton);


    article.appendChild(poster);
    article.appendChild(body);


    article.addEventListener("click", () => {
        openPlayer(movie);
    });


    article.addEventListener("keydown", event => {

        if (event.key === "Enter" || event.key === " ") {

            event.preventDefault();

            openPlayer(movie);
        }
    });


    return article;
}


function createPosterPlaceholder() {

    const placeholder = document.createElement("div");

    placeholder.className = "poster-placeholder";
    placeholder.textContent = "🎬";
    placeholder.setAttribute("aria-hidden", "true");

    return placeholder;
}


function addMetaItem(container, value) {

    const span = document.createElement("span");

    span.textContent = value;

    container.appendChild(span);
}


/* =========================================================
   FEATURED MOVIE / HERO
   ========================================================= */

function setFeaturedMovie(movie) {

    if (!movie) {
        setDefaultHero();
        return;
    }

    selectedMovie = movie;

    elements.heroTitle.textContent =
        safeText(movie.title, "MovieFlixKH");

    elements.heroDescription.textContent =
        safeText(
            movie.description,
            "មើលភាពយន្តនេះនៅលើ MovieFlixKH។"
        );


    setElementText(elements.heroYear, movie.year);
    setElementText(elements.heroGenre, getGenreText(movie));
    setElementText(elements.heroQuality, movie.quality);

    if (hasRating(movie)) {
        setElementText(
            elements.heroRating,
            `⭐ ${formatRating(movie.rating)}`
        );
    } else {
        setElementText(elements.heroRating, "");
    }


    const backdropUrl =
        getBackdropUrl(movie) || getPosterUrl(movie);

    if (backdropUrl) {

        elements.heroBackdrop.src = backdropUrl;

        elements.heroBackdrop.alt =
            safeText(movie.title, "Featured movie");

        elements.heroBackdrop.onerror = () => {
            elements.heroBackdrop.removeAttribute("src");
        };

    } else {

        elements.heroBackdrop.removeAttribute("src");
        elements.heroBackdrop.alt = "";
    }
}


function setDefaultHero() {

    selectedMovie = null;

    if (elements.heroTitle) {
        elements.heroTitle.textContent = "MovieFlixKH";
    }

    if (elements.heroDescription) {
        elements.heroDescription.textContent =
            "ស្វាគមន៍មកកាន់ MovieFlixKH — មើលភាពយន្ត និងវីដេអូអនឡាញ។";
    }

    setElementText(elements.heroYear, "");
    setElementText(elements.heroGenre, "");
    setElementText(elements.heroQuality, "");
    setElementText(elements.heroRating, "");

    elements.heroBackdrop.removeAttribute("src");
    elements.heroBackdrop.alt = "";
}


/* =========================================================
   PLAYER
   ========================================================= */

function openPlayer(movie) {

    if (!movie || !movie.id) {
        showToast("មិនមាន Movie ID", "⚠️");
        return;
    }

    selectedMovie = movie;

    const streamUrl =
        getApiUrl(`/stream/${encodeURIComponent(movie.id)}`);

    elements.playerMovieTitle.textContent =
        safeText(movie.title, "Movie");

    elements.videoLoading.hidden = false;

    elements.videoPlayer.pause();

    elements.videoPlayer.removeAttribute("src");

    elements.videoPlayer.load();

    elements.videoPlayer.src = streamUrl;

    elements.videoPlayer.load();

    renderMovieDetails(movie);

    elements.downloadButton.disabled = false;

    elements.playerModal.hidden = false;

    document.body.classList.add("modal-open");

    requestAnimationFrame(() => {

        elements.videoLoading.hidden = true;

        elements.videoPlayer.play().catch(() => {
            // Autoplay may be blocked by browser.
        });
    });
}


function closePlayer() {

    elements.videoPlayer.pause();

    elements.videoPlayer.removeAttribute("src");

    elements.videoPlayer.load();

    elements.playerModal.hidden = true;

    document.body.classList.remove("modal-open");

    selectedMovie = null;
}


function renderMovieDetails(movie) {

    elements.detailsTitle.textContent =
        safeText(movie.title, "Unknown Movie");

    elements.detailsDescription.textContent =
        safeText(movie.description, "មិនមានការពិពណ៌នា។");


    const metaParts = [];

    if (movie.year) {
        metaParts.push(movie.year);
    }

    if (movie.duration) {
        metaParts.push(movie.duration);
    }

    if (movie.quality) {
        metaParts.push(movie.quality);
    }

    elements.detailsMeta.textContent =
        metaParts.join(" • ");


    elements.detailsRating.textContent =
        hasRating(movie)
            ? `⭐ ${formatRating(movie.rating)}`
            : "⭐ —";


    setDetailValue(elements.detailsYear, movie.year);
    setDetailValue(elements.detailsCountry, movie.country);
    setDetailValue(elements.detailsGenre, getGenreText(movie));
    setDetailValue(elements.detailsDuration, movie.duration);
    setDetailValue(elements.detailsQuality, movie.quality);
    setDetailValue(elements.detailsLanguage, movie.language);
    setDetailValue(elements.detailsSubtitle, movie.subtitle);
}


/* =========================================================
   DOWNLOAD
   ========================================================= */

function downloadMovie() {

    if (!selectedMovie || !selectedMovie.id) {
        showToast("មិនអាចទាញយកភាពយន្តបានទេ", "⚠️");
        return;
    }

    const downloadUrl =
        getApiUrl(
            `/download/${encodeURIComponent(selectedMovie.id)}`
        );

    const link = document.createElement("a");

    link.href = downloadUrl;
    link.target = "_blank";
    link.rel = "noopener";

    document.body.appendChild(link);

    link.click();

    link.remove();

    showToast("កំពុងចាប់ផ្តើម Download…", "📥");
}


/* =========================================================
   SHARE
   ========================================================= */

async function shareMovie() {

    if (!selectedMovie) {
        return;
    }

    const title =
        safeText(selectedMovie.title, "MovieFlixKH");

    const shareText =
        `🎬 ${title}\nMovieFlixKH`;


    try {

        if (navigator.share) {

            await navigator.share({
                title,
                text: shareText,
                url: window.location.href
            });

            return;
        }


        if (navigator.clipboard) {

            await navigator.clipboard.writeText(
                window.location.href
            );

            showToast(
                "បានចម្លង Link រួចហើយ",
                "🔗"
            );

            return;
        }

    } catch (error) {

        if (error.name === "AbortError") {
            return;
        }

        console.error("Share error:", error);
    }

    showToast(
        "មិនអាច Share បានទេ",
        "⚠️"
    );
}


/* =========================================================
   INFO MODAL
   ========================================================= */

function openInfo(movie) {

    if (!movie) {
        return;
    }

    selectedMovie = movie;

    elements.infoModalBody.innerHTML = "";

    const title = document.createElement("h3");

    title.textContent =
        safeText(movie.title, "Unknown Movie");

    const description = document.createElement("p");

    description.textContent =
        safeText(movie.description, "មិនមានការពិពណ៌នា។");

    description.style.marginTop = "12px";


    const info = document.createElement("div");

    info.style.marginTop = "18px";
    info.style.display = "grid";
    info.style.gap = "8px";


    addInfoRow(info, "ឆ្នាំ", movie.year);
    addInfoRow(info, "ប្រទេស", movie.country);
    addInfoRow(info, "Genre", getGenreText(movie));
    addInfoRow(info, "រយៈពេល", movie.duration);
    addInfoRow(info, "Quality", movie.quality);
    addInfoRow(info, "Language", movie.language);
    addInfoRow(info, "Subtitle", movie.subtitle);
    addInfoRow(info, "Rating", hasRating(movie) ? movie.rating : "");


    elements.infoModalBody.appendChild(title);
    elements.infoModalBody.appendChild(description);
    elements.infoModalBody.appendChild(info);

    elements.infoModal.hidden = false;

    document.body.classList.add("modal-open");
}


function addInfoRow(container, label, value) {

    if (!hasValue(value)) {
        return;
    }

    const row = document.createElement("div");

    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.gap = "15px";
    row.style.padding = "10px 0";
    row.style.borderBottom =
        "1px solid rgba(255,255,255,.08)";


    const labelElement = document.createElement("span");

    labelElement.textContent = label;
    labelElement.style.color = "#777";


    const valueElement = document.createElement("strong");

    valueElement.textContent = formatValue(value);


    row.appendChild(labelElement);
    row.appendChild(valueElement);

    container.appendChild(row);
}


function closeInfo() {

    elements.infoModal.hidden = true;

    if (elements.playerModal.hidden) {
        document.body.classList.remove("modal-open");
    }
}


/* =========================================================
   SEARCH
   ========================================================= */

function handleSearch(event) {

    searchQuery = event.target.value || "";

    elements.clearSearchButton.hidden =
        searchQuery.trim() === "";

    applyFilters();
}


function clearSearch() {

    elements.searchInput.value = "";

    searchQuery = "";

    elements.clearSearchButton.hidden = true;

    applyFilters();
}


function focusSearch() {

    const searchSection =
        document.querySelector("#search");

    if (searchSection) {

        searchSection.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }

    setTimeout(() => {
        elements.searchInput.focus();
    }, 350);
}


/* =========================================================
   CATEGORY / GENRE
   ========================================================= */

function handleCategoryClick(event) {

    const button =
        event.target.closest(".category-button");

    if (!button) {
        return;
    }

    selectedCategory =
        button.dataset.category || "all";


    document
        .querySelectorAll(".category-button")
        .forEach(item => {
            item.classList.toggle(
                "active",
                item === button
            );
        });


    applyFilters();
}


function handleGenreClick(event) {

    const card =
        event.target.closest(".genre-card");

    if (!card) {
        return;
    }

    const genre =
        card.dataset.genre || "all";

    selectedCategory =
        genre.toLowerCase();


    document
        .querySelectorAll(".category-button")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.category === selectedCategory
            );
        });


    applyFilters();

    document
        .querySelector("#movies")
        ?.scrollIntoView({
            behavior: "smooth"
        });
}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function toggleMenu() {

    const isOpen =
        elements.mainNavigation.classList.toggle("open");

    elements.menuToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
    );
}


function closeMenu() {

    elements.mainNavigation.classList.remove("open");

    elements.menuToggle.setAttribute(
        "aria-expanded",
        "false"
    );
}


/* =========================================================
   EVENTS
   ========================================================= */

function bindEvents() {

    elements.searchInput.addEventListener(
        "input",
        handleSearch
    );

    elements.clearSearchButton.addEventListener(
        "click",
        clearSearch
    );

    elements.headerSearchButton.addEventListener(
        "click",
        focusSearch
    );

    elements.menuToggle.addEventListener(
        "click",
        toggleMenu
    );


    elements.mainNavigation.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(".nav-link")
            ) {
                closeMenu();
            }
        }
    );


    elements.categoryContainer.addEventListener(
        "click",
        handleCategoryClick
    );


    elements.genreGrid.addEventListener(
        "click",
        handleGenreClick
    );


    elements.retryButton.addEventListener(
        "click",
        loadMovies
    );


    elements.footerRetryButton.addEventListener(
        "click",
        loadMovies
    );


    elements.viewAllButton.addEventListener(
        "click",
        () => {

            selectedCategory = "all";

            document
                .querySelectorAll(".category-button")
                .forEach(button => {
                    button.classList.toggle(
                        "active",
                        button.dataset.category === "all"
                    );
                });

            searchQuery = "";

            elements.searchInput.value = "";

            elements.clearSearchButton.hidden = true;

            applyFilters();

            document
                .querySelector("#movies")
                ?.scrollIntoView({
                    behavior: "smooth"
                });
        }
    );


    elements.heroWatchButton.addEventListener(
        "click",
        () => {

            if (selectedMovie) {
                openPlayer(selectedMovie);
            } else if (movies.length) {
                openPlayer(movies[0]);
            } else {
                focusSearch();
            }
        }
    );


    elements.heroInfoButton.addEventListener(
        "click",
        () => {

            if (selectedMovie) {
                openInfo(selectedMovie);
            } else if (movies.length) {
                openInfo(movies[0]);
            } else {
                showToast(
                    "មិនទាន់មានព័ត៌មានភាពយន្ត",
                    "ℹ️"
                );
            }
        }
    );


    elements.closePlayerButton.addEventListener(
        "click",
        closePlayer
    );


    elements.closeInfoButton.addEventListener(
        "click",
        closeInfo
    );


    elements.downloadButton.addEventListener(
        "click",
        downloadMovie
    );


    elements.shareButton.addEventListener(
        "click",
        shareMovie
    );


    elements.playerModal
        .querySelector(".modal-backdrop")
        .addEventListener(
            "click",
            closePlayer
        );


    elements.infoModal
        .querySelector(".modal-backdrop")
        .addEventListener(
            "click",
            closeInfo
        );


    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                if (!elements.playerModal.hidden) {
                    closePlayer();
                }

                if (!elements.infoModal.hidden) {
                    closeInfo();
                }

                closeMenu();
            }
        }
    );


    elements.videoPlayer.addEventListener(
        "loadstart",
        () => {
            elements.videoLoading.hidden = false;
        }
    );


    elements.videoPlayer.addEventListener(
        "canplay",
        () => {
            elements.videoLoading.hidden = true;
        }
    );


    elements.videoPlayer.addEventListener(
        "playing",
        () => {
            elements.videoLoading.hidden = true;
        }
    );


    elements.videoPlayer.addEventListener(
        "waiting",
        () => {
            elements.videoLoading.hidden = false;
        }
    );


    elements.videoPlayer.addEventListener(
        "error",
        () => {

            elements.videoLoading.hidden = true;

            showToast(
                "មិនអាចចាក់ Video បានទេ",
                "⚠️"
            );
        }
    );
}


/* =========================================================
   UI STATES
   ========================================================= */

function showLoading() {

    elements.loading.hidden = false;

    elements.error.hidden = true;

    elements.emptyState.hidden = true;

    elements.movieGrid.hidden = true;
}


function hideLoading() {

    elements.loading.hidden = true;

    elements.movieGrid.hidden = false;
}


function showError() {

    elements.error.hidden = false;

    elements.movieGrid.hidden = true;
}


function hideError() {

    elements.error.hidden = true;
}


function showEmpty(message) {

    elements.emptyState.hidden = false;

    if (message) {

        const paragraph =
            elements.emptyState.querySelector("p");

        if (paragraph) {
            paragraph.textContent = message;
        }
    }

    elements.movieGrid.hidden = true;
}


function hideEmpty() {

    elements.emptyState.hidden = true;

    elements.movieGrid.hidden = false;
}


function showConfigurationMessage() {

    elements.loading.hidden = true;

    elements.movieGrid.hidden = true;

    elements.error.hidden = false;

    const title =
        elements.error.querySelector("h3");

    const paragraph =
        elements.error.querySelector("p");

    if (title) {
        title.textContent =
            "ត្រូវកំណត់ API URL ជាមុន";
    }

    if (paragraph) {
        paragraph.textContent =
            "បើក app.js ហើយប្តូរ YOUR-API-URL ទៅជា Cloudflare Tunnel URL របស់អ្នក។";
    }
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message, icon = "✓") {

    elements.toastMessage.textContent = message;

    elements.toastIcon.textContent = icon;

    elements.toast.hidden = false;


    clearTimeout(toastTimer);


    toastTimer = setTimeout(() => {

        elements.toast.hidden = true;

    }, 2800);
}


/* =========================================================
   DATA HELPERS
   ========================================================= */

function getPosterUrl(movie) {

    if (!movie) {
        return "";
    }

    return normalizeUrl(movie.poster);
}


function getBackdropUrl(movie) {

    if (!movie) {
        return "";
    }

    return normalizeUrl(movie.backdrop);
}


function normalizeUrl(value) {

    if (!hasValue(value)) {
        return "";
    }

    const text = String(value).trim();

    if (
        text.startsWith("http://") ||
        text.startsWith("https://") ||
        text.startsWith("data:image/")
    ) {
        return text;
    }

    return "";
}


function getGenreText(movie) {

    if (!movie || !Array.isArray(movie.genre)) {
        return "";
    }

    return movie.genre
        .filter(item => hasValue(item))
        .map(item => String(item).trim())
        .join(" • ");
}


function hasRating(movie) {

    if (!movie) {
        return false;
    }

    const rating =
        Number(movie.rating);

    return Number.isFinite(rating) && rating > 0;
}


function formatRating(value) {

    const rating = Number(value);

    if (!Number.isFinite(rating)) {
        return "—";
    }

    return rating % 1 === 0
        ? String(rating)
        : rating.toFixed(1);
}


function safeText(value, fallback = "") {

    if (!hasValue(value)) {
        return fallback;
    }

    return String(value);
}


function formatValue(value) {

    if (Array.isArray(value)) {
        return value.join(", ");
    }

    return String(value);
}


function hasValue(value) {

    if (value === null || value === undefined) {
        return false;
    }

    if (Array.isArray(value)) {
        return value.length > 0;
    }

    return String(value).trim() !== "";
}


function setElementText(element, value) {

    if (!element) {
        return;
    }

    element.textContent =
        hasValue(value)
            ? formatValue(value)
            : "";
}


function setDetailValue(element, value) {

    if (!element) {
        return;
    }

    element.textContent =
        hasValue(value)
            ? formatValue(value)
            : "—";
}


/* =========================================================
   ONLINE / OFFLINE NOTICE
   ========================================================= */

window.addEventListener("offline", () => {

    showToast(
        "Internet connection ត្រូវបានផ្តាច់",
        "📡"
    );
});


window.addEventListener("online", () => {

    showToast(
        "Internet connection បានភ្ជាប់វិញ",
        "✅"
    );

    if (movies.length === 0) {
        loadMovies();
    }
});
