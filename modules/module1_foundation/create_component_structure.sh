#!/bin/bash

# Task: Create Component Structure
# This script creates a modular component structure for the application

echo "Starting task: Create Component Structure"
echo "========================================"

# Create component directories
echo "Creating component directories..."
mkdir -p app/components/ui
mkdir -p app/components/layout
mkdir -p app/components/server
mkdir -p app/components/kitchen
mkdir -p app/components/admin

# Create UI components
echo "Creating UI components..."

# Button component
cat > app/components/ui/Button.js << 'EOF'
/**
 * Button Component
 * 
 * A reusable button component that supports various styles and sizes.
 */

class Button {
  constructor(options = {}) {
    this.type = options.type || 'primary';
    this.size = options.size || 'default';
    this.text = options.text || '';
    this.icon = options.icon || null;
    this.onClick = options.onClick || null;
  }

  render() {
    const button = document.createElement('button');
    button.className = `btn btn-${this.type}${this.size !== 'default' ? ` btn-${this.size}` : ''}`;
    
    if (this.icon) {
      const iconElement = document.createElement('i');
      iconElement.className = this.icon;
      button.appendChild(iconElement);
    }
    
    if (this.text) {
      const textSpan = document.createElement('span');
      textSpan.textContent = this.text;
      button.appendChild(textSpan);
    }
    
    if (this.onClick) {
      button.addEventListener('click', this.onClick);
    }
    
    return button;
  }
}

// Export the component
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Button;
}
EOF

# Card component
cat > app/components/ui/Card.js << 'EOF'
/**
 * Card Component
 * 
 * A reusable card component for displaying content in a contained box.
 */

class Card {
  constructor(options = {}) {
    this.title = options.title || '';
    this.content = options.content || '';
    this.headerActions = options.headerActions || null;
    this.footerContent = options.footerContent || null;
  }

  render() {
    const card = document.createElement('div');
    card.className = 'card';
    
    if (this.title || this.headerActions) {
      const header = document.createElement('div');
      header.className = 'card-header';
      
      if (this.title) {
        const title = document.createElement('h3');
        title.className = 'card-title';
        title.textContent = this.title;
        header.appendChild(title);
      }
      
      if (this.headerActions) {
        header.appendChild(this.headerActions);
      }
      
      card.appendChild(header);
    }
    
    const body = document.createElement('div');
    body.className = 'card-body';
    
    if (typeof this.content === 'string') {
      body.innerHTML = this.content;
    } else if (this.content instanceof Node) {
      body.appendChild(this.content);
    }
    
    card.appendChild(body);
    
    if (this.footerContent) {
      const footer = document.createElement('div');
      footer.className = 'card-footer';
      
      if (typeof this.footerContent === 'string') {
        footer.innerHTML = this.footerContent;
      } else if (this.footerContent instanceof Node) {
        footer.appendChild(this.footerContent);
      }
      
      card.appendChild(footer);
    }
    
    return card;
  }
}

// Export the component
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Card;
}
EOF

# Create layout components
echo "Creating layout components..."

# Header component
cat > app/components/layout/Header.js << 'EOF'
/**
 * Header Component
 * 
 * A reusable header component for the application.
 */

class Header {
  constructor(options = {}) {
    this.user = options.user || null;
    this.notifications = options.notifications || 0;
    this.onNotificationsClick = options.onNotificationsClick || null;
    this.onProfileClick = options.onProfileClick || null;
  }

  render() {
    const header = document.createElement('header');
    
    const logo = document.createElement('img');
    logo.src = '/static/img/logo.png';
    logo.alt = 'Plate';
    logo.className = 'logo';
    logo.id = 'logo';
    header.appendChild(logo);
    
    const actions = document.createElement('div');
    actions.className = 'header-actions';
    
    const notificationsBtn = document.createElement('button');
    notificationsBtn.className = 'btn btn-secondary btn-sm';
    notificationsBtn.innerHTML = '<i class="fas fa-bell"></i><span>Notifications</span>';
    
    if (this.onNotificationsClick) {
      notificationsBtn.addEventListener('click', this.onNotificationsClick);
    }
    
    actions.appendChild(notificationsBtn);
    
    if (this.user) {
      const userInfo = document.createElement('div');
      userInfo.className = 'user-info';
      
      const userName = document.createElement('span');
      userName.textContent = this.user.name;
      userInfo.appendChild(userName);
      
      const userAvatar = document.createElement('div');
      userAvatar.className = 'user-avatar';
      userAvatar.textContent = this.user.initials;
      
      if (this.onProfileClick) {
        userAvatar.style.cursor = 'pointer';
        userAvatar.addEventListener('click', this.onProfileClick);
      }
      
      userInfo.appendChild(userAvatar);
      actions.appendChild(userInfo);
    }
    
    header.appendChild(actions);
    
    return header;
  }
}

// Export the component
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Header;
}
EOF

# Create server view components
echo "Creating server view components..."

# FloorPlan component
cat > app/components/server/FloorPlan.js << 'EOF'
/**
 * FloorPlan Component
 * 
 * A component for displaying and interacting with the restaurant floor plan.
 */

class FloorPlan {
  constructor(options = {}) {
    this.tables = options.tables || [];
    this.onTableSelect = options.onTableSelect || null;
    this.onRefresh = options.onRefresh || null;
    this.onViewKitchen = options.onViewKitchen || null;
    this.selectedTableId = options.selectedTableId || null;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'floor-plan-container';
    
    const controls = document.createElement('div');
    controls.className = 'floor-plan-controls';
    
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'btn btn-secondary btn-sm';
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i><span>Refresh</span>';
    
    if (this.onRefresh) {
      refreshBtn.addEventListener('click', this.onRefresh);
    }
    
    controls.appendChild(refreshBtn);
    
    const kitchenBtn = document.createElement('button');
    kitchenBtn.className = 'btn btn-secondary btn-sm';
    kitchenBtn.innerHTML = '<i class="fas fa-eye"></i><span>View Kitchen Display</span>';
    
    if (this.onViewKitchen) {
      kitchenBtn.addEventListener('click', this.onViewKitchen);
    }
    
    controls.appendChild(kitchenBtn);
    
    container.appendChild(controls);
    
    const floorPlan = document.createElement('div');
    floorPlan.className = 'floor-plan';
    
    this.tables.forEach(table => {
      const tableElement = document.createElement('div');
      tableElement.id = `table${table.id}`;
      tableElement.className = `table table-${table.type}`;
      
      if (table.status === 'occupied') {
        tableElement.classList.add('occupied');
      }
      
      if (table.id === this.selectedTableId) {
        tableElement.classList.add('selected');
      }
      
      tableElement.style.top = `${table.y}px`;
      tableElement.style.left = `${table.x}px`;
      tableElement.style.width = `${table.width}px`;
      tableElement.style.height = `${table.height}px`;
      tableElement.textContent = table.id;
      
      if (this.onTableSelect) {
        tableElement.addEventListener('click', () => this.onTableSelect(table.id));
      }
      
      floorPlan.appendChild(tableElement);
    });
    
    container.appendChild(floorPlan);
    
    return container;
  }
}

// Export the component
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FloorPlan;
}
EOF

# Create kitchen view components
echo "Creating kitchen view components..."

# OrderCard component
cat > app/components/kitchen/OrderCard.js << 'EOF'
/**
 * OrderCard Component
 * 
 * A component for displaying order cards in the kitchen display system.
 */

class OrderCard {
  constructor(options = {}) {
    this.id = options.id || null;
    this.tableId = options.tableId || null;
    this.status = options.status || 'new'; // new, cooking, ready
    this.items = options.items || [];
    this.notes = options.notes || '';
    this.time = options.time || 'Just now';
    this.timer = options.timer || '00:00';
    this.timerStatus = options.timerStatus || 'normal'; // normal, warning, danger
    this.onStatusChange = options.onStatusChange || null;
    this.takeOut = options.takeOut || false;
  }

  render() {
    const card = document.createElement('div');
    card.className = `order-card ${this.status}`;
    
    const header = document.createElement('div');
    header.className = 'order-card-header';
    
    const info = document.createElement('div');
    info.className = 'order-card-info';
    
    const table = document.createElement('div');
    table.className = 'order-card-table';
    table.innerHTML = `<i class="fas fa-${this.takeOut ? 'shopping-bag' : 'utensils'}"></i> ${this.takeOut ? `Take Out #${this.tableId}` : `Table ${this.tableId}`}`;
    info.appendChild(table);
    
    const time = document.createElement('div');
    time.className = 'order-card-time';
    time.innerHTML = `<i class="far fa-clock"></i> ${this.time}`;
    info.appendChild(time);
    
    header.appendChild(info);
    
    const timer = document.createElement('div');
    timer.className = `timer${this.timerStatus !== 'normal' ? ` ${this.timerStatus}` : ''}`;
    timer.textContent = this.timer;
    header.appendChild(timer);
    
    card.appendChild(header);
    
    const items = document.createElement('div');
    items.className = 'order-card-items';
    
    this.items.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'order-card-item';
      
      const itemName = document.createElement('div');
      itemName.className = 'order-card-item-name';
      itemName.innerHTML = `<span class="order-card-quantity">${item.quantity}x</span> ${item.name}`;
      itemElement.appendChild(itemName);
      
      if (item.seat) {
        const seat = document.createElement('div');
        seat.className = 'seat-number';
        seat.textContent = `Seat ${item.seat}`;
        itemElement.appendChild(seat);
      }
      
      items.appendChild(itemElement);
    });
    
    card.appendChild(items);
    
    if (this.notes) {
      const notes = document.createElement('div');
      notes.className = 'order-card-note';
      notes.textContent = this.notes;
      card.appendChild(notes);
    }
    
    const actions = document.createElement('div');
    actions.className = 'order-card-actions';
    
    const actionBtn = document.createElement('button');
    actionBtn.className = 'card-action-btn';
    
    if (this.status === 'new') {
      actionBtn.classList.add('cooking');
      actionBtn.innerHTML = '<i class="fas fa-fire"></i> Start Cooking';
      if (this.onStatusChange) {
        actionBtn.addEventListener('click', () => this.onStatusChange('cooking'));
      }
    } else if (this.status === 'cooking') {
      actionBtn.classList.add('ready');
      actionBtn.innerHTML = '<i class="fas fa-check"></i> Mark Ready';
      if (this.onStatusChange) {
        actionBtn.addEventListener('click', () => this.onStatusChange('ready'));
      }
    } else if (this.status === 'ready') {
      actionBtn.classList.add('bump');
      actionBtn.innerHTML = '<i class="fas fa-hand-point-right"></i> Bump Order';
      if (this.onStatusChange) {
        actionBtn.addEventListener('click', () => this.onStatusChange('complete'));
      }
    }
    
    actions.appendChild(actionBtn);
    card.appendChild(actions);
    
    return card;
  }
}

// Export the component
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OrderCard;
}
EOF

# Create admin view components
echo "Creating admin view components..."

# MetricCard component
cat > app/components/admin/MetricCard.js << 'EOF'
/**
 * MetricCard Component
 * 
 * A component for displaying metrics in the admin dashboard.
 */

class MetricCard {
  constructor(options = {}) {
    this.label = options.label || '';
    this.value = options.value || '';
    this.trend = options.trend || null; // { direction: 'up'|'down', value: '10%' }
  }

  render() {
    const card = document.createElement('div');
    card.className = 'metric-card';
    
    const label = document.createElement('div');
    label.className = 'metric-label';
    label.textContent = this.label;
    card.appendChild(label);
    
    const value = document.createElement('div');
    value.className = 'metric-value';
    value.textContent = this.value;
    card.appendChild(value);
    
    if (this.trend) {
      const trend = document.createElement('div');
      trend.className = `metric-trend${this.trend.direction ? ` trend-${this.trend.direction}` : ''}`;
      
      if (this.trend.direction) {
        const icon = document.createElement('i');
        icon.className = `fas fa-arrow-${this.trend.direction}`;
        trend.appendChild(icon);
      }
      
      const trendValue = document.createElement('span');
      trendValue.textContent = this.trend.value;
      trend.appendChild(trendValue);
      
      card.appendChild(trend);
    }
    
    return card;
  }
}

// Export the component
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MetricCard;
}
EOF

# Create main component index file
echo "Creating component index file..."
cat > app/components/index.js << 'EOF'
/**
 * Component Library Index
 * 
 * This file exports all components for easy importing.
 */

// UI Components
import Button from './ui/Button.js';
import Card from './ui/Card.js';

// Layout Components
import Header from './layout/Header.js';

// Server View Components
import FloorPlan from './server/FloorPlan.js';

// Kitchen View Components
import OrderCard from './kitchen/OrderCard.js';

// Admin View Components
import MetricCard from './admin/MetricCard.js';

// Export all components
export {
  // UI
  Button,
  Card,
  
  // Layout
  Header,
  
  // Server
  FloorPlan,
  
  // Kitchen
  OrderCard,
  
  // Admin
  MetricCard
};
EOF

# Verify the component structure
echo "Verifying component structure..."
if [ -d "app/components" ] && [ -f "app/components/index.js" ]; then
    echo "Component structure created successfully"
else
    echo "Error: Component structure creation failed"
    exit 1
fi

echo "Task completed: Create Component Structure"
exit 0
