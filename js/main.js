function selectLayout(event) {
  const selectedItem = event.currentTarget;
  const layout = selectedItem.getAttribute('data-layout');
  localStorage.setItem('chosenLayout', layout);

  // Remove highlight from all
  document.querySelectorAll('.layout-item').forEach(item => {
    item.classList.remove('selected');
  });

  // Highlight the selected one
  selectedItem.classList.add('selected');
}
function goTo(page) {
  window.location.href = page;
}
