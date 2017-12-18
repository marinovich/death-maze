
(function() {
    function Sprite(url, pos, size, updateSpeed, frames, type, dir, once, scale) {
        this.url = url;
        this.pos = pos;
        this.size = size;
        this.updateSpeed = typeof updateSpeed === 'number' ? updateSpeed : 1;
        this.frames = frames || [0];
        this.frame = this.frames[0];
        this._index = 0;        
        this.dir = dir || 'horizontal';
        this.once = once || true;
        this.scale = scale || 1;
        this.resource = resources.get(url);
        this.type = type;
    };

    Sprite.prototype = {

        checkEnd: function () {
            if (!this.once) {
                return false;
            }
            if (this.once && this._index >= this.frames.length) {
                this._index = 0;
                return true;
            }
            return false;
        },

        update: function(dt) {
            //this._index += this.updateSpeed * dt;
            this._index += dt / this.updateSpeed;
        },

        render: function(ctx) {
            var frame;

            if(this.updateSpeed > 0) {
                var max = this.frames.length;
                var idx = Math.floor(this._index);
                frame = this.frames[idx % max];
            }
            else {
                frame = 0;
            }


            var x = this.pos[0];
            var y = this.pos[1];

            if(this.dir == 'vertical') {
                y += frame * this.size[1];
            }
            else {
                x += frame * this.size[0];
            }

            ctx.drawImage(resources.get(this.url),
                          x, y,
                          this.size[0], this.size[1],
                          0, 0,
                          this.size[0] * this.scale, this.size[1] * this.scale);        
        },

        drawColumn: function(ctx,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
            let max = this.frames.length;
            let idx = Math.floor(this._index);
            let frame = this.frames[idx % max];

            let x = this.pos[0];
            x += frame * this.size[0];

            ctx.drawImage(a1,a2 + x,a3,a4,a5,a6,a7,a8,a9);
        }
    };

    window.Sprite = Sprite;
})();