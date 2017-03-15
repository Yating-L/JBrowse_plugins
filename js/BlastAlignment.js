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
        _buildSequenceContainer: function(proteinSeq) {
            var subject = proteinSeq['subject'];
            var query = proteinSeq['query'];
            var num = subject.length;
            var table = '';
            var container = document.createElement('div');
            container.className = 'fastaView';
            
            var textArea = document.createElement('textarea');
            
            textArea.rows = '30';
            textArea.cols= '600';
            textArea.className = 'fasta';
            textArea.readOnly = true;

            var match_str = '';
            for (var i = 0; i < num; i++) {
                table += subject[i];
                if (query[i] === subject[i])
                    match_str += '|';
                else
                    match_str += ' ';
            }
            table += '\n';
            table += match_str + '\n';
            table += query + '\n';
            textArea.value = table;
            container.appendChild(textArea);
            return container;
        },
        
        _showDialog: function(feature, content) {
          //  console.log(feature.get('name'));
            var sequenceDialog = new Dialog({
                title: 'Alignment for ' + feature.get('id'),
                content: content
            });
            
            sequenceDialog.show();
        },

        _renderTranslation: function(feature, seq) {
            var reading_frame = feature.get('reading_frame');
            var query = feature.get('query');
            var offset = parseInt(reading_frame[0]),
                extraBases = (seq.length - offset) % 3,
                seqSliced = seq.slice(offset, seq.length - extraBases),
                proteinSeq = {
                    'subject' : '',
                    'query' : query
                };
            //console.log(seqSliced)
            for( var i = 0; i < seqSliced.length; i += 3 ) {
                var nextCodon = seqSliced.slice(i, i + 3);
                var aminoAcid = this._codonTable[nextCodon] || '#';
                proteinSeq['subject'] += aminoAcid;
               // console.log(proteinSeq);
            }
            //console.log(proteinSeq);
            return proteinSeq;
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
                        var proteinSeq = track._renderTranslation(feature, seq);
                        var content = track._buildSequenceContainer(proteinSeq);

                        track._showDialog(feature, content);
                    });
                });
            };
        },

        constructor: function() {
            var config = this.config;

            config.menuTemplate.push({
                'label' : 'View alignment',
                'iconClass' : 'dijitIconDatabase',
                'action' : this._getProteinSequenceFunc(this)
            });

            this._codonTable = this.generateCodonTable(lang.mixin(this.defaultCodonTable,this.config.codonTable));
        }
        
    }); 
}  
);
