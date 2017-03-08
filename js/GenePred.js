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
            var num = proteinSeq.length;
            var table = '';
            var container = document.createElement('div');
            container.className = 'fastaView';
            
            var textArea = document.createElement('textarea');
            
            textArea.rows = '30';
            textArea.cols= '62';
            textArea.className = 'fasta';
            textArea.readOnly = true;

            for (var i = 0; i < num; i++) {
                table += '>' + proteinSeq[i]['name'] + '\n' + proteinSeq[i]['prot_seq'] + '\n';
            }
            textArea.value = table;
            container.appendChild(textArea);
            return container;
        },
        
        _showDialog: function(feature, content) {
          //  console.log(feature.get('name'));
            var sequenceDialog = new Dialog({
                title: 'Protein sequence for ' + feature.get('id'),
                content: content
            });
            
            sequenceDialog.show();
        },

        // Extract coding exons and translate sequence
        _extractCodingExons: function(feature, seq) {
           // console.log(feature.get('id'));
            var subfeatures = feature.get('subfeatures'),
                featureStart = feature.get('start'),
                cds_name = feature.get('id'),
                codingSeq = [],
                exons,  //cds for each mRNA
                single_exons = {
                    'name' : cds_name,
                    'coding_seq' : ''
                }, //there is only one mRNA
                subfeatureStart,
                subfeatureEnd,
                num = subfeatures.length,
                cds,
                cds_num,
                reverse = feature.get('strand') == -1 ? true : false;
            
            for (var j = 0; j < num; j++) {
                if (subfeatures[j].get('type') == 'mRNA' || subfeatures[j].get('type') == 'transcript') {
                    cds_name = subfeatures[j].get('id') || 'mRNA_'+j;
                    cds = subfeatures[j].get('subfeatures');
                    cds_num = cds.length;
                    exons = {
                        'name' : cds_name,
                        'coding_seq' : ''
                    };
                    for (var i = 0; i < cds_num; i++) {
                        subfeatureStart = cds[i].get('start');
                        subfeatureEnd = cds[i].get('end');
                        //console.log(subfeatureStart);
                        //console.log(subfeatureEnd);
                        exons['coding_seq'] += seq.substring(subfeatureStart - featureStart, subfeatureEnd - featureStart);
                //console.log(exons);
                    }
                    if (reverse) {
                        exons['coding_seq'] = Util.revcom(exons['coding_seq']);
                        exons['offset'] = cds[cds_num-1].get('phase');
                    }
                    else
                        exons['offset'] = cds[0].get('phase');
                    codingSeq.push(exons);
                }

                else if (subfeatures[j].get('type') == 'CDS') {
                    subfeatureStart = subfeatures[j].get('start');
                    subfeatureEnd = subfeatures[j].get('end');
                        //console.log(subfeatureStart);
                        //console.log(subfeatureEnd);
                    single_exons['coding_seq'] += seq.substring(subfeatureStart - featureStart, subfeatureEnd - featureStart);
                }
                else {
                    throw 'no CDS in the gene \n';
                }     
            }
            if (single_exons['coding_seq'] !== '') {
                if (reverse) {
                    single_exons['coding_seq'] = Util.revcom(single_exons['coding_seq']);
                    single_exons['offset'] = subfeatures[num-1].get('phase');
                }
                else
                    single_exons['offset'] = subfeatures[0].get('phase');
                codingSeq.push(single_exons);
            }
            //console.log(codingSeq);
            return codingSeq;
        },

        _renderTranslation: function(codingExons) {
            var num = codingExons.length,
                seq,
                offset,
                extraBases,
                seqSliced,
                cds_name,
                prot,
                proteinSeq = [];
            for (var j = 0; j < num; j++) {
              //  console.log(codingExons[j]);
                seq = codingExons[j]['coding_seq'];
                offset = codingExons[j]['offset'];
                cds_name = codingExons[j]['name'];

                extraBases = (seq.length - offset) % 3;
                seqSliced = seq.slice( offset, seq.length - extraBases );
                prot = {
                    'name' : cds_name,
                    'prot_seq' : ''
                };

                for( var i = 0; i < seqSliced.length; i += 3 ) {
                    var nextCodon = seqSliced.slice(i, i + 3);
                    var aminoAcid = this._codonTable[nextCodon] || '#';
                    prot['prot_seq'] += aminoAcid;
                }
                proteinSeq.push(prot);
            }
          //  console.log(proteinSeq);
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
        
    }); 
}  
);

