/**
 * ==========================================================================
 * 電子簽名板 (Signature Pad) 控制器
 * 支援手寫觸控平滑繪圖與高解析螢幕
 * ==========================================================================
 */

class SignaturePad {
  constructor(canvasElement, hintElement) {
    this.canvas = canvasElement;
    this.hint = hintElement;
    this.ctx = this.canvas.getContext('2d');
    this.isDrawing = false;
    this.hasDrawn = false;
    this.lastX = 0;
    this.lastY = 0;

    this.resizeCanvas();
    this.initEvents();
  }

  resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = this.canvas.getBoundingClientRect();
    
    // 依容器寬度動態適應
    this.canvas.width = rect.width * ratio;
    this.canvas.height = rect.height * ratio;
    this.ctx.scale(ratio, ratio);
    
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = '#1e3a8a'; // 深藍色鋼筆筆觸
  }

  initEvents() {
    // 監聽視窗變形以維持高解析
    window.addEventListener('resize', () => {
      // 避免重設時洗掉已畫內容，簡單保留狀態
      if (!this.hasDrawn) {
        this.resizeCanvas();
      }
    });

    // 滑鼠事件
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    window.addEventListener('mouseup', () => this.stopDrawing());

    // 觸控事件 (手機 / 平板)
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.startDrawing(touch);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.draw(touch);
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => this.stopDrawing());
  }

  getCoordinates(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  startDrawing(e) {
    this.isDrawing = true;
    const { x, y } = this.getCoordinates(e);
    this.lastX = x;
    this.lastY = y;
    
    if (this.hint) {
      this.hint.style.opacity = '0';
    }
  }

  draw(e) {
    if (!this.isDrawing) return;
    const { x, y } = this.getCoordinates(e);

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();

    this.lastX = x;
    this.lastY = y;
    this.hasDrawn = true;
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  clear() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    this.ctx.clearRect(0, 0, this.canvas.width / ratio, this.canvas.height / ratio);
    this.hasDrawn = false;
    if (this.hint) {
      this.hint.style.opacity = '1';
    }
  }

  isEmpty() {
    return !this.hasDrawn;
  }

  toDataURL() {
    if (this.isEmpty()) return '';
    return this.canvas.toDataURL('image/png');
  }
}
