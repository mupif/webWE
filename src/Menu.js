class VisualMenu {
    constructor(name="") {
        this.name = name;
        this.menus = [];
        this.items = [];
    }

    getName() {
        return this.name;
    }

    getMenus() {
        return this.menus;
    }

    getItems() {
        return this.items;
    }

    addMenu(menu) {
        this.menus.push(menu);
    }

    addItem(item) {
        this.items.push(item);
    }

    addItemIntoSubMenu(item, trace) {
        let trace_list = trace.split('.');
        let current_menu = this;
        let menu_name;
        let submenu_search;
        let new_menu;
        for(let i=0;i<trace_list.length;i++){
            menu_name = trace_list[i];
            submenu_search = current_menu.getMenuWithName(menu_name);
            if(submenu_search != null)
                current_menu = submenu_search;
            else
            {
                new_menu = new VisualMenu(menu_name);
                current_menu.addMenu(new_menu);
                current_menu = new_menu;
            }
        }
        current_menu.addItem(item);
    }

    getItemWithKeyword(keyword) {
        let items = this.getItems();
        for(let i=0;i<items.length;i++)
            if(items[i].getKeyword() === keyword)
                return items[i];
        return null;
    }

    getMenuWithName(name) {
        let menus = this.getMenus();
        for(let i=0;i<menus.length;i++)
            if (menus[i].getName() === name)
                return menus[i];
        return null;
    }
}


class VisualMenuItem {
    constructor(keyword, value, text, input_type="", input_caption="", input_options=[]) {
        this.keyword = keyword;
        this.value = value;
        this.text = text;
        this.input_type = input_type; // '' or 'select' or 'int' or 'float' or 'str'
        this.input_caption = input_caption;
        this.input_options = input_options;
    }

    getKeyword() {
        return this.keyword;
    }

    getText() {
        return this.text;
    }

    getValue() {
        return this.value;
    }

    getInputType() {
        return this.input_type;
    }

    getInputCaption() {
        return this.input_caption;
    }

    getInputOptions() {
        return this.input_options;
    }
}