export const NavigationStack = {
    init: () => {
        const currentPath = window.location.pathname;
        let stack = JSON.parse(localStorage.getItem('pageStack') || '[]');

        if (stack.length === 0) {
            stack = [currentPath];
        } else {
            stack[stack.length - 1] = currentPath; // Replace last entry on reload
        }
        localStorage.setItem('pageStack', JSON.stringify(stack));
    },

    push: (path) => {
        const stack = JSON.parse(localStorage.getItem('pageStack') || '[]');
        if (stack[stack.length - 1] !== path) {
            stack.push(path);
            localStorage.setItem('pageStack', JSON.stringify(stack));
            window.location.reload(); // reload after push
        }
        return stack;
    },

    pop: () => {
        const stack = JSON.parse(localStorage.getItem('pageStack') || '[]');
        if (stack.length > 1) {
            const popped = stack.pop();
            localStorage.setItem('pageStack', JSON.stringify(stack));
            window.location.reload(); // reload after pop
            return {
                previousPath: stack[stack.length - 1],
                poppedPath: popped
            };
        }
        return {
            previousPath: '/',
            poppedPath: null
        };
    },

    current: () => {
        const stack = JSON.parse(localStorage.getItem('pageStack') || '[]');
        return stack[stack.length - 0] || '/';
    },

    getStack: () => {
        return JSON.parse(localStorage.getItem('pageStack') || '[]');
    },

    clear: () => {
        localStorage.setItem('pageStack', JSON.stringify(['/']));
        window.location.reload(); // reload after clear
    }
};
