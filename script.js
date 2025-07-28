const mainNav = document.getElementById('mainNav');
const gallery = document.getElementById('gallery');
const pagination = document.getElementById('pagination');
const themeToggle = document.getElementById('themeToggle');
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modalImg');
const closeModal = document.getElementById('closeModal');
const downloadBtn = document.getElementById('downloadBtn');
const searchInput = document.getElementById('searchInput');

let currentGroupIndex = 0;
let currentCategoryIndex = 0;
let currentPage = 1;
let searchQuery = '';
let columnCount = 0;
const itemsPerPage = 50;

function resetSearch() {
    searchQuery = '';
    searchInput.value = '';
}

function renderNavigation() {
  mainNav.innerHTML = '';
  galleryData.forEach((group, groupIndex) => {
    const li = document.createElement('li');
    li.className = 'nav-group';

    const groupButton = document.createElement('button');
    groupButton.className = 'group-btn';
    groupButton.innerHTML = `<span>${group.group}</span>`;
    groupButton.onclick = () => {
      if (currentGroupIndex !== groupIndex) {
        currentGroupIndex = groupIndex;
        currentCategoryIndex = 0;
        currentPage = 1;
        resetSearch();
        renderAll();
      }
    };
    li.appendChild(groupButton);

    if (group.categories && group.categories.length > 0) {
      const categoryList = document.createElement('ul');
      categoryList.className = 'category-list';
      group.categories.forEach((category, categoryIndex) => {
        const categoryLi = document.createElement('li');
        const categoryButton = document.createElement('button');
        categoryButton.textContent = category.name;
        categoryButton.className = 'category-btn';
        categoryButton.onclick = () => {
          currentGroupIndex = groupIndex;
          currentCategoryIndex = categoryIndex;
          currentPage = 1;
          resetSearch();
          renderAll();
        };
        categoryLi.appendChild(categoryButton);
        categoryList.appendChild(categoryLi);
      });
      li.appendChild(categoryList);
    }
    mainNav.appendChild(li);
  });
  updateNavActiveState();
}

function updateNavActiveState() {
  document.querySelectorAll('#mainNav .group-btn, #mainNav .category-btn').forEach(btn => btn.classList.remove('active'));
  
  if (searchQuery) {
    return;
  }

  const groupBtn = mainNav.children[currentGroupIndex]?.querySelector('.group-btn');
  if (groupBtn) {
    groupBtn.classList.add('active');
  }

  const categoryList = mainNav.children[currentGroupIndex]?.querySelector('.category-list');
  if (categoryList) {
    const categoryBtn = categoryList.children[currentCategoryIndex]?.querySelector('.category-btn');
    if (categoryBtn) {
      categoryBtn.classList.add('active');
    }
  }
}

function getFilteredImages() {
    if (searchQuery) {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const allImages = galleryData.flatMap(group => 
            group.categories.flatMap(category => category.images)
        );
        return allImages.filter(image => {
            const imageName = decodeURIComponent(image.path.split('/').pop()).toLowerCase();
            const imageTags = image.tags ? image.tags.toLowerCase() : '';
            return imageName.includes(lowerCaseQuery) || imageTags.includes(lowerCaseQuery);
        });
    } else {
        return galleryData[currentGroupIndex]?.categories[currentCategoryIndex]?.images || [];
    }
}

function getColumnCount() {
    const width = window.innerWidth;
    if (width > 1600) return 5;
    if (width > 1200) return 4;
    if (width > 768) return 3;
    if (width > 600) return 2;
    return 1;
}

function renderGallery() {
  gallery.innerHTML = '';
  const filteredImages = getFilteredImages();
  const numColumns = getColumnCount();
  columnCount = numColumns;

  if (!filteredImages || filteredImages.length === 0) {
    gallery.innerHTML = `<p style="text-align:center; width: 100%;">${searchQuery ? '未找到匹配的图片。' : '此分类下暂无图片。'}</p>`;
    return;
  }
  
  const columns = Array.from({ length: numColumns }, () => {
      const column = document.createElement('div');
      column.className = 'gallery-column';
      gallery.appendChild(column);
      return column;
  });

  const paginatedImages = filteredImages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  paginatedImages.forEach((image, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'gallery-item';
    
    const img = document.createElement('img');
    
    const optimizationParams = '?x-oss-process=image/resize,w_500/format,webp/quality,q_80';
    img.src = image.path + optimizationParams;

    img.alt = decodeURIComponent(image.path.split('/').pop());
    img.loading = 'lazy';
    img.onclick = () => openModal(image.path);

    itemDiv.appendChild(img);
    columns[index % numColumns].appendChild(itemDiv);
  });
}

function renderPagination() {
    pagination.innerHTML = '';
    const filteredImages = getFilteredImages();
    const totalItems = filteredImages.length;
    
    if (totalItems <= itemsPerPage) {
        pagination.style.display = 'none';
        return;
    }

    pagination.style.display = 'flex';
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const jumpToPage = (page) => {
        const pageNum = parseInt(page, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
            currentPage = pageNum;
            renderGallery();
            renderPagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const jumpInput = document.getElementById('page-jump-input');
            if(jumpInput) {
                jumpInput.style.borderColor = 'red';
                setTimeout(() => { jumpInput.style.borderColor = ''; }, 1500);
            }
        }
    };
    
    const createPageButton = (text, pageNumber, isDisabled = false, isActive = false) => {
        const btn = document.createElement('button');
        btn.innerHTML = text;
        btn.disabled = isDisabled;
        if (isActive) btn.classList.add('active');
        if (pageNumber) btn.onclick = () => jumpToPage(pageNumber);
        return btn;
    };
    
    pagination.appendChild(createPageButton('上一页', currentPage - 1, currentPage === 1));

    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
            pagination.appendChild(createPageButton(i, i, false, i === currentPage));
        }
    } else {
        const pageNumbers = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
        if (currentPage <= 3) { pageNumbers.add(2); pageNumbers.add(3); }
        if (currentPage >= totalPages - 2) { pageNumbers.add(totalPages - 1); pageNumbers.add(totalPages - 2); }
        
        let lastPage = 0;
        Array.from(pageNumbers).sort((a,b) => a - b).forEach(page => {
            if (page > 0 && page <= totalPages) {
                if (page > lastPage + 1) {
                    const ellipsis = document.createElement('span');
                    ellipsis.textContent = '...';
                    ellipsis.className = 'pagination-ellipsis';
                    pagination.appendChild(ellipsis);
                }
                pagination.appendChild(createPageButton(page, page, false, page === currentPage));
                lastPage = page;
            }
        });
    }

    pagination.appendChild(createPageButton('下一页', currentPage + 1, currentPage === totalPages));

    const jumpContainer = document.createElement('div');
    jumpContainer.className = 'pagination-jump';
    jumpContainer.innerHTML = '<span>到第</span><input type="number" id="page-jump-input" min="1" max="'+ totalPages +'"><span>页</span><button id="jumpBtn">跳转</button>';
    pagination.appendChild(jumpContainer);
    
    const input = jumpContainer.querySelector('input');
    const btn = jumpContainer.querySelector('button');
    btn.onclick = () => jumpToPage(input.value);
    input.onkeydown = (e) => { if (e.key === 'Enter') jumpToPage(input.value); };
}

function openModal(imageUrl) {
  modal.classList.remove('hidden');
  
  const previewParams = '?x-oss-process=image/resize,w_1920/format,webp/quality,q_85';
  modalImg.src = imageUrl + previewParams;
  
  const filename = decodeURIComponent(imageUrl.split('/').pop());
  downloadBtn.href = imageUrl;
  downloadBtn.download = filename;
}

function closeModalFunc() {
  modal.classList.add('hidden');
  modalImg.src = '';
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}

function toggleTheme() {
  const isDark = document.body.classList.contains('dark');
  const newTheme = isDark ? 'light' : 'dark';
  applyTheme(newTheme);
  localStorage.setItem('theme', newTheme);
}

function renderAll() {
  renderNavigation();
  renderGallery();
  renderPagination();
}

function init() {
  const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(savedTheme);

  renderAll();

  themeToggle.onclick = toggleTheme;
  
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    currentPage = 1; 
    updateNavActiveState();
    renderGallery();
    renderPagination();
  });
  
  window.addEventListener('resize', () => {
      const newColumnCount = getColumnCount();
      if (newColumnCount !== columnCount) {
          renderGallery();
      }
  });

  closeModal.onclick = closeModalFunc;
  modal.onclick = (e) => {
    if (e.target === modal) closeModalFunc();
  };
  document.addEventListener('keydown', (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) {
          closeModalFunc();
      }
  });
}

document.addEventListener('DOMContentLoaded', init);