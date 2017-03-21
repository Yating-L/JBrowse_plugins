define([
    'dojo/_base/declare', 
    'JBrowse/Util', 
    'dojo/_base/lang', 
    'JBrowse/View/Track/CanvasFeatures', 
    'JBrowse/Store/SeqFeature', 
    'dojo/Deferred', 
    'dijit/Dialog',
    'JBrowse/CodonTable',
    'dojo/number'
],
function(
    declare, 
    Util, 
    lang, 
    CanvasFeatures, 
    SeqFeature, 
    Deferred,
    Dialog,
    CondonTable,
    number
) {
    return declare([CanvasFeatures, CondonTable],{
        _buildSequenceContainer: function(alignments) {
            var length = alignments['length'];
            var match_num = alignments['match_num'];
            var seq_id = alignments['seqid'];
            var header = '<h1>' + seq_id + ' Length = ' + length + 
            ' Matches = ' + match_num + '</h1>',
                match_header,
                match_part,
                query_name,
                identities,
                positives,
                gaps,
                sub_len,
                iden_percent,
                posi_percent,
                gaps_percent,
                query,
                match_str,
                subject_str,
                matches = alignments['matches'],
                table = header,
                align_len, align_start,
                query_start, sbjct_start,
                query_end, sbjct_end,
                sub_query, sub_sbjct,
                query_title, sbjct_title, match_title, query_title_len, sbjct_title_len;

            var container = document.createElement('div');
            container.className = 'fastaView';
           
            for (var i = 0; i < match_num; i++) {
                match_part = matches[i];
                query_name = match_part['query_name'];
                identities = match_part['identities'];
                positives = match_part['positives'];
                gaps = match_part['gaps'];
                query = match_part['query'];
                match_str = match_part['match'];
                subject_str = match_part['subject'];
                sbjct_start = match_part['sub_start'];
                sbjct_end = match_part['sub_end'];
                sub_len = match_part['sub_end'] - match_part['sub_start'] + 1; 
                iden_percent = number.round(parseInt(identities) / parseInt(sub_len) * 100);
                posi_percent = number.round(parseInt(positives) / parseInt(sub_len) * 100);
                gaps_percent = number.round(parseInt(gaps) / parseInt(sub_len) * 100);
                match_header = '<h3>' + seq_id + ' ' + sbjct_start + ' ' + sbjct_end + 
                '  Query = ' + query_name + 
                '  Score = ' + match_part['score'] + '  Expect = ' + match_part['expect'] +
                '  Identities = ' + identities + ' / ' + sub_len + ' (' + iden_percent + '%) ' + 
                '  Positives = ' + positives + ' / ' + sub_len + ' (' + posi_percent + '%) ' +
                '  Gaps = ' + gaps + ' / ' + sub_len + ' (' + gaps_percent + '%) ' + '</h3>';
                table += match_header;
                align_len = query.length;
                align_start = 0;
                query_start = 1;
                while (align_start < align_len) {
                    sub_query = query.substring(align_start, align_start + 60);
                    sub_sbjct = subject_str.substring(align_start, align_start + 60);
                    query_end = query_start + sub_query.replace(/-/g, '').length - 1;
                    //sbjct length needs to multiple by 3 for tablstn
                    sbjct_end = sbjct_start + sub_sbjct.replace(/-/g, '').length * 3 - 1;
                    query_title = 'Query ' + query_start + ' ';
                    sbjct_title = 'Sbjct ' + sbjct_start + ' ';
                    query_title_len = query_title.length;
                    sbjct_title_len = sbjct_title.length;
                    //Make sure the indents are the same for query, match and sbjct
                    if (query_title_len == sbjct_title_len)
                        match_title = new Array(sbjct_title_len + 1).join(' ');
                    else if (query_title_len < sbjct_title_len) {
                        query_title += new Array(sbjct_title_len - query_title_len + 1).join(' ');
                        match_title = new Array(sbjct_title_len + 1).join(' ');
                    }
                    table += '<pre>' + query_title + query.substring(align_start, align_start + 60) + ' ' + query_end +'\n' 
                     + match_title +match_str.substring(align_start, align_start + 60) + '\n' 
                    + sbjct_title +subject_str.substring(align_start, align_start + 60) + ' ' + sbjct_end + '\n' + '</pre>' + '<br>';
                    align_start += 60;
                    query_start = query_end + 1;
                    sbjct_start = sbjct_end + 1;
                }
            }
            container.innerHTML = table;
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

        _renderAlignments: function(feature, seq) {
            var subfeatures = feature.get('subfeatures');
            var match_num = feature.get('match_num');
            var seqid = feature.get('seq_id');
            var start = feature.get('start');
            var length = seq.length;
            var sub_start,
                sub_end,
                reading_frame,
                query,
                query_name,
                match,
                gap,
                expect,
                score,
                identities,
                positives,
                gaps,
                alignments = {
                    'seqid' : seqid,
                    'length' : length,
                    'match_num' : match_num,
                    'matches' : []
                },
                match_part,
                subject;
            
            for (var i = 0; i < match_num; i++) {
                sub_start = subfeatures[i].get('start') - start + 1;
                sub_end = subfeatures[i].get('end') - start;
                subject = subfeatures[i].get('subject');
                query = subfeatures[i].get('query');
                match = subfeatures[i].get('match');
                expect = subfeatures[i].get('expect');
                score = subfeatures[i].get('score');
                identities = subfeatures[i].get('identities');
                positives = subfeatures[i].get('positives');
                gaps = parseInt(subfeatures[i].get('gaps'));
                reading_frame = subfeatures[i].get('frame');
                query_name = subfeatures[i].get('Target');
                match_part = {
                    'subject' : subject,
                    'query' : query,
                    'query_name' :  query_name,
                    'Gap' : gap,
                    'match' : match,
                    'identities' : identities,
                    'positives' : positives,
                    'gaps' : gaps,
                    'score' : score,
                    'expect' : expect,
                    'frame' : reading_frame,
                    'sub_start' : sub_start,
                    'sub_end' : sub_end
                };
                alignments['matches'].push(match_part);
            }
            return alignments;
        },

        _getAlignmentsFunc: function(track) {
            return function() {
                var feature = this.feature;

                track.browser.getStore('refseqs', function(refSeqStore) {
                    var region = {
                        ref: feature.get('seq_id'),
                        start: feature.get('start'),
                        end: feature.get('end')
                    };

                    refSeqStore.getReferenceSequence(region, function(seq) {
                        var proteinSeq = track._renderAlignments(feature, seq);
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
                'action' : this._getAlignmentsFunc(this)
            });

            this._codonTable = this.generateCodonTable(lang.mixin(this.defaultCodonTable,this.config.codonTable));
        }
        
    }); 
}  
);
