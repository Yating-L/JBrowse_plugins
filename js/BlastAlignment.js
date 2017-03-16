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
            var subject_str = '';
            var query = proteinSeq['query'];
            var gap = proteinSeq['Gap'].split(' ');
            var insert;
            var num = subject.length;
            var table = '';
            var container = document.createElement('div');
            container.className = 'fastaView';
            
            var textArea = document.createElement('textarea');
            
            textArea.rows = '30';
            textArea.cols= '600';
            textArea.className = 'fasta';
            textArea.readOnly = true;

            
            var start = 0, end = 0, i;
    
            for (i = 0; i < gap.length; i++) {
                if (gap[i][0] ==='I') {
                    insert = parseInt(gap[i].substring(1, gap[i].length));
                    subject_str += subject.slice(start, end);
                    start = end;
                    for (var j = 0; j < insert; j++) {
                        subject_str += '-';
                    }
                }
                else {
                    end += parseInt(gap[i].substring(1, gap[i].length));
                }
            }
            if (start < end) {
                subject_str += subject.slice(start, end);
            }

            var match_str = '';
            table += query + '\n';
            for (i = 0; i < num; i++) {
                if (query[i] === subject_str[i])
                    match_str += '|';
                else
                    match_str += ' ';
            }
            table += match_str + '\n';
            table += subject_str + '\n';
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
            var gap = feature.get('Gap');
            var strand = parseInt(reading_frame[1]);
           // console.log(seq); 
            if (strand < 0) {
                seq = Util.revcom(seq);
            }                            
            var extraBases = seq.length % 3;
            var seqSliced = seq.slice(0, seq.length - extraBases);
            var seqlen = seqSliced.length;
            var proteinSeq = {
                'subject' : '',
                'query' : query,
                'Gap' : ''
            };
           // console.log(strand);
            //console.log(seqSliced)
            for( var i = 0; i < seqlen; i += 3 ) {
                var nextCodon = seqSliced.slice(i, i + 3);
                var aminoAcid = this._codonTable[nextCodon] || '#';
                proteinSeq['subject'] += aminoAcid;
               // console.log(proteinSeq);
            }
            //console.log(proteinSeq['subject']);
            proteinSeq['Gap'] = gap;
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
