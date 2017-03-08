define([
    'dojo/_base/declare', 
    'JBrowse/Util', 
    'dojo/_base/lang', 
    'JBrowse/View/Track/CanvasFeatures', 
    'JBrowse/Store/SeqFeature', 
    'dojo/Deferred', 
    'dijit/Dialog',
    'JBrowse/CodonTable'
],
function(
    declare, 
    Util, 
    lang, 
    CanvasFeatures, 
    SeqFeature, 
    Deferred, 
    Dialog,
    CondonTable
) {
    return declare([CanvasFeatures, CondonTable],{
        _buildSequenceContainer: function(codingExons) {
            var container = document.createElement('div');
            container.className = 'fastaView';

            var textArea = document.createElement('textarea');

            textArea.rows = '30';
            textArea.cols= '62';
            textArea.className = 'fasta';
            textArea.readOnly = true;

            textArea.value = codingExons;
            container.appendChild(textArea);

            return container;
        },
        
        _showDialog: function(feature, content) {
            var sequenceDialog = new Dialog({
                title: 'Protein sequence for ' + feature.get('name'),
                content: content
            });
            
            sequenceDialog.show();
        },

        // TODO: Extract coding exons and translate sequence
        _extractCodingExons: function(feature, seq) {
            var subfeatures = feature.get('subfeatures'),
                featureStart = feature.get('start'),
                offset,
                exons = '',
                num = subfeatures.length;

            for (var i = 0; i < num; i++) {
                //var console = console.log(subfeatures[i]);
                var subfeatureStart = subfeatures[i].get('start');
                var subfeatureEnd = subfeatures[i].get('end');
                //console.log(subfeatureStart);
                //console.log(subfeatureEnd);
                exons += seq.substring(subfeatureStart - featureStart, subfeatureEnd - featureStart);
                //console.log(exons);
            }
            if (feature.get('strand') == -1) {
                exons = Util.revcom(exons);
                offset = subfeatures[num-1].get('phase');
            } 
            else
                offset = subfeatures[0].get('phase');
            return [exons, offset];
        },

        _renderTranslation: function(codingExons) {
            var seq = codingExons[0];
            var offset = codingExons[1];
            var extraBases = (seq.length - offset) % 3;
            var seqSliced = seq.slice( offset, seq.length - extraBases );
            var translated = '';

            for( var i = 0; i < seqSliced.length; i += 3 ) {
                var nextCodon = seqSliced.slice(i, i + 3);
                var aminoAcid = this._codonTable[nextCodon] || '#';
                translated += aminoAcid;
            }
            return translated;
        },

        _getProteinSequenceFunc: function(track) {
            return function() {
                var feature = this.feature;

                track.browser.getStore('refseqs', function(refSeqStore) {
                    var region = {
                        ref: feature.get('seq_id'),
                        start: feature.get('start'),
                        end: feature.get('end')
                    };

                    refSeqStore.getReferenceSequence(region, function(seq) {
                        var codingExons = track._extractCodingExons(feature, seq);
                        var proteinSeq = track._renderTranslation(codingExons);
                        var content = track._buildSequenceContainer(proteinSeq);

                        track._showDialog(feature, content);
                    });
                });
            };
        },

        constructor: function() {
            var config = this.config;

            config.menuTemplate.push({
                'label' : 'View translated protein',
                'iconClass' : 'dijitIconDatabase',
                'action' : this._getProteinSequenceFunc(this)
            });

            this._codonTable = this.generateCodonTable(lang.mixin(this.defaultCodonTable,this.config.codonTable));
        }
/*
        _defaultConfig: function() {
            return Util.deepUpdate(
            lang.clone( this.inherited(arguments) ),
            {
                "menuTemplate" : [ 
        {   
         "label" : "View details",
       },  
       {   
         "label" : "Highlight this gene",
       },  
       {   
         "label" : "View translated protein",
         "action" : "contentDialog",
         "iconClass" : "dijitIconDatabase",
         "content" : dojo.hitch(this, 'getSequence')
         //"content" : function(track,feature,div) { var fullseq = ''; var refSeqStore = track.browser.getStore('refseqs', dojo.hitch(this, function(refSeqStore) { if (refSeqStore) {refSeqStore.getReferenceSequence({ref:feature.get('seq_id'),start:feature.get('start'),end:feature.get('end')},function(seq) { fullseq = fullseq.concat(seq); },function(){});} else{console.log("no refseqstore");}})); return fullseq;}
       }
   ]
            }) 
            }
*/
        
    }); 
}  
);

