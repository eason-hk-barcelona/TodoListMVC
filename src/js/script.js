class TodoList {
  constructor() {
    this.ul = document.querySelector('#todo ul');
    this.newTodo = document.querySelector('#new-todo');
    this.card = document.querySelector('.card');
    this.span = document.querySelector('.card span');
    this.all = document.querySelector('#all');
    this.active = document.querySelector('#active');
    this.completed = document.querySelector('#completed');
    this.toggleAll = document.querySelector('.toggle-all');
    this.cleanCompleted = document.querySelector('.Clear-completed');
    this.isAllSelected = 0;

    this.arrList = []; // 保存所有任务
    this.count = 0; // 任务数
    this.flag = 2; // 区分正常插入的 update 和 drag 的 update
    this.lis = []; //捕获当前ul中li的顺序
    // 从本地存储加载数据
    this.loadFromLocalStorage();
    this.init();
    this.parsedData;
  }

  init() {
    // 监听输入框，添加要做的任务
    this.newTodo.addEventListener('keyup', (e) => {
      if (e.keyCode == 13) {
        if (this.newTodo.value !== '') {
          this.addList(this.newTodo.value);
          this.newTodo.value = '';
          this.card.classList.replace('hideCard', 'showCard');
          this.span.innerHTML = this.count + ' items left';
          if (this.all.checked) {
            this.showAll();
          }
          if (this.active.checked) {
            this.showActive();
          }
          if (this.completed.checked) {
            this.showCompleted();
          }
        }
      }
    });

    // 监听任务被删除、完成、未完成
    this.ul.addEventListener('click', (e) => {
      this.change(e);
      if (this.all.checked) {
        this.showAll();
      }
      if (this.active.checked) {
        this.showActive();
      }
      if (this.completed.checked) {
        this.showCompleted();
      }
    });

    // 实现拖拽变换顺序功能
    let dragged;

    this.ul.addEventListener('dragstart', (e) => {
      this.lis = Array.from(this.ul.getElementsByTagName('li'));
      dragged = e.target;
      this.arrList.find(item => item.li === dragged).time !== null ? this.flag = 1 : this.flag = 2;
      e.target.style.opacity = '0.8';
    });

    this.ul.addEventListener('dragover', (e) => {
      e.preventDefault(); //阻止事件的默认行为
    });

    this.ul.addEventListener('drop', (e) => {
      const target = e.target.closest('li');
      const bounding = target.getBoundingClientRect();

      if (e.clientY - bounding.y > bounding.height / 2) {
        if (target.nextSibling !== dragged) {
          this.ul.insertBefore(dragged, target.nextSibling);
          this.updateList();
        }
      } else {
        if (target !== dragged) {
          this.ul.insertBefore(dragged, target);
          this.updateList();
        }
      }
    });

    this.ul.addEventListener('dragend', (e) => {
      e.target.style.opacity = '1';
      this.flag = 0;
    });

    this.all.addEventListener('click', () => this.showAll());

    this.active.addEventListener('click', () => this.showActive());

    this.completed.addEventListener('click', () => this.showCompleted());

    this.cleanCompleted.addEventListener('click', () => this.clearCompleted());

    this.toggleAll.addEventListener('click', () => {
      this.isAllSelected === 1 ? this.removeAll() : this.selectAll();
    });
  }

  change(e) {
    if (e.target.localName === 'button') {
      const i = this.arrList.findIndex((item) => item.li === e.target.parentNode);
      // 若点击button要删除的任务是未完成的，则count数也要减一
      if (!e.target.parentNode.children[0].checked) {
        this.count--;
        this.span.innerHTML = this.count + ' items left';
      }
      this.arrList.splice(i, 1);
      e.target.parentNode.parentNode.removeChild(e.target.parentNode);
      if (this.arrList.length === 0) {
        this.card.classList.replace('showCard', 'hideCard');
      }
      this.saveToLocalStorage();
    } else if (e.target.localName === 'input') {
      // 若点击的是input，则判断任务是否完成
      if (e.target.checked) {
        e.target.parentNode.classList.add('check');
        e.target.parentNode.classList.replace('unfinished', 'finished');
        this.count--;
        this.span.innerHTML = this.count + ' items left';
      } else {
        e.target.parentNode.classList.remove('check');
        e.target.parentNode.classList.add('removeCheck');
        e.target.parentNode.classList.replace('finished', 'unfinished');
        this.count++;
        this.span.innerHTML = this.count + ' items left';
      }
      this.saveToLocalStorage();
    }
  }

  // 从本地存储加载数据
  loadFromLocalStorage() {
    const data = localStorage.getItem('todoList');
    if (data) {
      this.parsedData = JSON.parse(data);
      this.parsedData.forEach(item => this.addList(item.label));
      this.newTodo.value = '';
      this.card.classList.replace('hideCard', 'showCard');
      this.span.innerHTML = this.count + ' items left';
    }
  }

  // 保存数据到本地存储
  saveToLocalStorage() {
    const dataToSave = this.arrList.map(item => {
      return { label: item.li.querySelector('label').innerText };
    });
    localStorage.setItem('todoList', JSON.stringify(dataToSave));
  }

  addList(val) {
    let li = document.createElement('li');
    li.classList.add('box');
    li.classList.add('list');
    li.classList.add('unfinished');
    let content = `
        <input type="checkbox" class="toggle"></input>
        <label>${val}</label>
        <button>x</button>
      `;
    li.innerHTML = content;
    li.setAttribute('draggable', 'true'); // 添加可拖拽属性
    // 正则提取时间并排序
    const regex = /(\d{1,2}:\d{1,2})/g;
    let matches = val.match(regex);
    if (matches) {
      const time = matches[0];
      const timeSplit = time.split(':');

      let timeObj = null;

      if (timeSplit.length === 2) {
        const hours = parseInt(timeSplit[0]);
        const minutes = parseInt(timeSplit[1]);

        if (!isNaN(hours) && !isNaN(minutes)) {
          timeObj = new Date();
          timeObj.setHours(hours);
          timeObj.setMinutes(minutes);
        }
      }
      this.arrList.push({ li: li, time: timeObj });
    } else this.arrList.push({ li: li, time: null });
    this.flag = 0;
    this.count++;
    this.updateList();
    this.saveToLocalStorage();// 在添加任务时保存到本地存储
  }

  updateList() {
    let timeList = [];
    let normalList = [];
    if (this.flag === 1) {
      // 创建一个新的数组，按照 lis 中的顺序填充
      const newArrList = this.lis.map((li) => {
        const index = this.arrList.findIndex((item) => item.li === li);
        return this.arrList[index];
      });
      // 将 arrList 更新为新的排序后的数组
      this.arrList = newArrList;
    }
    else if (this.flag === 2) {
      this.lis = Array.from(this.ul.getElementsByTagName('li'));
      const newArrList = this.lis.map((li) => {
        const index = this.arrList.findIndex((item) => item.li === li);
        return this.arrList[index];
      });
      // 将 arrList 更新为新的排序后的数组
      this.arrList = newArrList;
    }
    this.arrList.forEach(item => {
      if (item.time) timeList.push(item);
      else normalList.push(item);
    });
    timeList.sort((a, b) => {
      return a.time && b.time ? a.time.getTime() - b.time.getTime() : 0;
    });
    this.ul.innerHTML = '';
    timeList.forEach(item => {
      this.ul.appendChild(item.li);
    });

    normalList.forEach(item => this.ul.appendChild(item.li));
    this.saveToLocalStorage();
  }

  // unfinished代表未完成的任务
  // finished代表已完成的任务
  // unfinishedHide代表隐藏未完成的任务
  // finishedHide代表隐藏已完成的任务

  showAll() {
    this.updateList();
    this.arrList.forEach(item => {
      item.li.classList.replace('finishedHide', 'finished');
      item.li.classList.replace('unfinishedHide', 'unfinished');
    });
  }

  showActive() {
    this.updateList();
    this.arrList.forEach(item => {
      item.li.classList.replace('unfinishedHide', 'unfinished');
      item.li.classList.replace('finished', 'finishedHide');
    });
  }

  showCompleted() {
    this.updateList();
    this.arrList.forEach(item => {
      item.li.classList.replace('finishedHide', 'finished');
      item.li.classList.replace('unfinished', 'unfinishedHide');
    });
  }

  selectAll() {
    this.arrList.forEach(item => {
      if (!item.li.children[0].checked) {
        item.li.children[0].checked = true;
        item.li.classList.add('check');
        item.li.classList.replace('unfinished', 'finished');
        this.count--;
        this.span.innerHTML = this.count + ' items left';
        this.isAllSelected = 1;
      }
    });
  }

  removeAll() {
    this.arrList.forEach(item => {
      if (item.li.children[0].checked) {
        item.li.children[0].checked = false;
        item.li.classList.remove('check');
        item.li.classList.add('removeCheck');
        item.li.classList.replace('finished', 'unfinished');
        this.count++;
        this.span.innerHTML = this.count + ' items left';
        this.isAllSelected = 0;
      }
    });
  }

  clearCompleted() {
    this.updateList();
    const indexesToRemove = []; //先统一收集所有已完成li
    this.arrList.forEach((item, index) => {
      if (item.li.children[0].checked) {
        indexesToRemove.push(index);
        item.li.parentNode.removeChild(item.li);
      }
    });
    indexesToRemove.reverse().forEach(index => this.arrList.splice(index, 1));
    this.saveToLocalStorage();
  }
}

const todoList = new TodoList();
