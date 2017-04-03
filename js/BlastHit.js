/*The BlastHit plugin was written by Wilson Leung */

/*global define dojo */
/* eslint-disable no-underscore-dangle */
/* eslint-disable strict */

define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'JBrowse/View/FeatureGlyph/Box'
],
function(
   declare,
   array,
   lang,
   FeatureGlyph
) {
    return declare(FeatureGlyph, {
        _getHitColor: function(feature) {
            var score = feature.get('score'),
                featureColor = "0,0,0";

            if      (score >  500) { featureColor = "200,45,24";  }
            else if (score >= 200) { featureColor = "100,50,0";   }
            else if (score >= 80)  { featureColor = "192,96,154"; }
            else if (score >= 50)  { featureColor = "34,139,34";  }
            else if (score >= 40)  { featureColor =  "51,102,255"; }

            return 'rgb('+ featureColor +')';
        },

        _calcMaxLevel: function(feature) {
            var subfeatures = feature.get('subfeatures');

            // sort subfeatures by start coordinate
            subfeatures.sort(function(a, b) {
                return a.get('start') - b.get('start');
            });

            var currentLevel = 0,
                maxLevel = currentLevel,
                prevFeature = subfeatures[0];

            for (var i=1; i<subfeatures.length; i+=1) {
                if (prevFeature.get('end') >= subfeatures[i].get('start')) {
                    currentLevel += 1;
                } else {
                    currentLevel = Math.max(currentLevel - 1, 0);
                }

                maxLevel = Math.max(currentLevel, maxLevel);

                prevFeature = subfeatures[i];
            }

            return maxLevel;
        },

        _drawRectangle: function(context, x1, x2, y, hitHeight) {
            context.rect(x1, y, x2 - x1, hitHeight);
            context.fill();
            context.stroke();
        },

        _drawReverseFeature: function(subfeature, context, fRect, level) {
            var style = lang.hitch(this, 'getStyle'),
                block = fRect.viewInfo.block,
                x1 = block.bpToX(subfeature.get('start')),
                x2 = block.bpToX(subfeature.get('end')),
                hitStyles = style(fRect.f, 'hit'),
                arrowWidth = hitStyles.arrowWidth,
                hitHeight = hitStyles.height,
                y = fRect.t + (hitHeight * level);

            context.fillStyle = this._getHitColor(subfeature);

            context.beginPath();

            // draw box instead of arrow if the box is smaller than arrow
            if ((x2 - x1) < arrowWidth) {
                this._drawRectangle(context, x1, x2, y, hitHeight);
                return;
            }

            context.moveTo(x2, y);

            context.lineTo(x1 + arrowWidth, y);
            context.lineTo(x1,              y + (hitHeight / 2));
            context.lineTo(x1 + arrowWidth, y + hitHeight);
            context.lineTo(x2,              y + hitHeight);
            context.closePath();

            context.fill();
            context.stroke();
        },

        _drawForwardFeature: function(subfeature, context, fRect, level) {
            var style = lang.hitch(this, 'getStyle'),
                block = fRect.viewInfo.block,
                x1 = block.bpToX(subfeature.get('start')),
                x2 = block.bpToX(subfeature.get('end')),
                hitStyles = style(fRect.f, 'hit'),
                arrowWidth = hitStyles.arrowWidth,
                hitHeight = hitStyles.height,
                y = fRect.t + (hitHeight * level);

            context.fillStyle = this._getHitColor(subfeature);

            context.beginPath();

            // draw box instead of arrow if the box is smaller than arrow
            if ((x2 - x1) < arrowWidth) {
                this._drawRectangle(context, x1, x2, y, hitHeight);
                return;
            }

            context.moveTo(x1,              y);
            context.lineTo(x2 - arrowWidth, y);
            context.lineTo(x2,              y + (hitHeight / 2));
            context.lineTo(x2 - arrowWidth, y + hitHeight);
            context.lineTo(x1,              y + hitHeight);
            context.closePath();

            context.fill();
            context.stroke();
        },

        _drawFeature: function(subfeature, context, fRect, level) {
            if (subfeature.get('strand') == -1) {
                this._drawReverseFeature(subfeature, context, fRect, level);
            } else {
                this._drawForwardFeature(subfeature, context, fRect, level);
            }
        },

        renderFeature: function(context, fRect) {
            // clear previous features (workaround for overlapping labels)
            if( this.track.displayMode !== 'collapsed' ) {
                context.clearRect( Math.floor(fRect.l),
                                   fRect.t,
                                   Math.ceil(fRect.w-Math.floor(fRect.l)+fRect.l),
                                   fRect.h );
            }

            this.renderBox( context, fRect.viewInfo, fRect.f, fRect.t, fRect.rect.h, fRect.f );

            context.save();

            context.lineWidth = 1;
            context.strokeStyle = 'black';

            var feature = fRect.f;

            var subfeatures = feature.get('subfeatures').sort(function(a, b) {
                return a.get('start') - b.get('start');
            });

            var level = 0,
                prevFeature;

            for (var i=0; i<subfeatures.length; i+=1) {
                var subfeature = subfeatures[i];

                if ((prevFeature) &&
                    (prevFeature.get('end') >= subfeature.get('start'))) {
                    level += 1;
                } else {
                    level = Math.max(level - 1, 0);
                }

                this._drawFeature(subfeature, context, fRect, level);

                subfeature._level = level;

                prevFeature = subfeature;
            }

            context.restore();

            this.renderLabel( context, fRect );
            this.renderDescription( context, fRect );
        },

        _hasYOverlap: function(subfeature, fRect) {
            var hitHeight = this._getHitHeight();
            var featureTop = fRect.t + subfeature._level * hitHeight;
            var featureBottom = featureTop + hitHeight;

            var featureCanvas = fRect.viewInfo.block.featureCanvas;
            var clientRect = featureCanvas.getBoundingClientRect();

            var relativeMouseY = document.mouseY - clientRect.top;

            return ((relativeMouseY >= featureTop) &&
                    (relativeMouseY <= featureBottom));
        },

        _hasXOverlap: function(mouseOverBase, subfeature) {
            return ((mouseOverBase >= subfeature.get('start')) &&
                    (mouseOverBase <= subfeature.get('end')));
        },

        _getMouseOverFeature: function(feature, fRect) {
            var that = this,
                mouseOverBase = this.browser.view.absXtoBp(document.mouseX),
                subfeatures = feature.get('subfeatures');

            if (typeof subfeatures === undefined) {
                return feature;
            }

            // determine if mouse is over a subfeature
            for (var i=0; i<subfeatures.length; i++) {
                var subfeature = subfeatures[i];

                if ((that._hasXOverlap(mouseOverBase, subfeature)) &&
                    (that._hasYOverlap(subfeature, fRect))) {

                    return subfeature;
                }
            }

            return feature;
        },

        mouseoverFeature: function( context, fRect ) {
            var feature = fRect.f;
            var selectedFeature = this._getMouseOverFeature(feature, fRect);

            var block = fRect.viewInfo.block,
                x1 = block.bpToX(selectedFeature.get('start')),
                x2 = block.bpToX(selectedFeature.get('end')),
                y = fRect.t,
                h = fRect.rect.h;

            if (selectedFeature.get("type") === "match_part") {
                context.fillStyle = this.getStyle( fRect.f,
                                                   'mouseoversubfeaturecolor' );

                var hitHeight = this._getHitHeight();
                var subfeatureTop = y + selectedFeature._level * hitHeight;

                context.fillRect( x1, subfeatureTop, x2 - x1, hitHeight);

            } else {
                context.fillStyle = this.getStyle( fRect.f,
                                                   'mouseovercolor' );

                context.fillRect( x1, y, x2 - x1, h);
            }
        },

        _getHitHeight: function() {
            return this.config.style.hit.height;
        },

        _defaultConfig: function() {
            var arrowWidth = 10,
                hitHeight = 20,
                marginBottom = 10;

            return this._mergeConfigs(dojo.clone(this.inherited(arguments)), {
                style: {
                    hit: {
                        height: hitHeight,
                        arrowWidth: arrowWidth
                    },

                    height: function(feature) {
                        // add 1 because levels are 0-based
                        var levelsHeight = hitHeight * (this._calcMaxLevel(feature) + 1);

                        return levelsHeight + this.config.style.marginBottom;
                    },

                    color: 'rgb(242,242,242)',

                    strandArrow: true,
                    marginBottom: marginBottom,
                    borderColor: 'rgb(200,200,200)'
                }
            });
        }
    });
});
