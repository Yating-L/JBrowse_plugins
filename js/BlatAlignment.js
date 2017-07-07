define([
    'dojo/_base/declare', 
    'JBrowse/Util', 
    'dojo/_base/lang', 
    'JBrowse/View/Track/CanvasFeatures', 
    'JBrowse/Store/SeqFeature', 
    'dijit/Dialog',
    'dojo/number',
    'dojo/string',
    'dojo/dom',
    'dojo/dom-construct'
],
function(
    declare, 
    Util, 
    lang, 
    CanvasFeatures, 
    SeqFeature, 
    Dialog,
    number,
    string,
    dom,
    domConstruct
) {
    return declare(CanvasFeatures,{
        _renderHTML: function(alignments) {
            var container = domConstruct.create('div'),
                seq_id = alignments['seqid'],
                matches = alignments['matches'],
                length = alignments['length'],
                match_num = alignments['match_num'],
                start = alignments['start'],
                header = '<h1>' + seq_id + ' ' + start + '...' + alignments['end'] + ' Length = ' + length + 
            ' Matches = ' + match_num + ' Strand = ' + alignments['strand']+ '</h1>',
                num = matches.length,
                alignment_blocks = '',
                match_part,
                region = domConstruct.create('h1', {
                    innerHTML: header,
                    className: 'region',
                    style: {
                        fontWeight: 'bold'
                    }
                }, container),
                i;
            for (i = 0; i < num; i++) {
                match_part = matches[i];
                alignment_blocks += this._getMatches(seq_id, match_part);
            }
            domConstruct.create('div', {
                innerHTML: alignment_blocks
            }, region, 'after');

            return container;
        }, 

        _getMatches: function(seq_id, match_part) {
            var query_name = match_part['query_name'],
                query = match_part['query'],
                subject_str = match_part['subject'],
                sbjct_start = match_part['sub_start'],
                sbjct_end = match_part['sub_end'],
                match_str = match_part['match'],
                query_start = match_part['query_start'],
                sub_len = match_part['sub_end'] - match_part['sub_start'] + 1,
                match_header = '<h3>' + seq_id + ' ' + sbjct_start + ' ' + sbjct_end + 
                '  Query = ' + query_name +'</h3>',
                align_block = this._getAlignBlock(query, match_str, subject_str, query_start, sbjct_start, sbjct_end);

            return match_header + align_block;
        },

        _getAlignBlock: function(query, match_str, subject, query_start, sbjct_start, sbjct_end) {
            var align_len = query.length,
                strand,
                align_start = 0,
                query_end,
                sbjct_end,
                sub_query,
                sub_sbjct,
                match_title,
                query_title, query_title_len,
                sbjct_title, sbjct_title_len,
                block = '<pre>';
            if (sbjct_end < sbjct_start) {
                strand = -1;
            }
            else {
                strand = 1;
            }
            query_start += 1;
            while (align_start < align_len) {
                sub_query = query.substring(align_start, align_start + 50);
                sub_sbjct = subject.substring(align_start, align_start + 50);
                query_end = query_start + sub_query.length - 1;
                if (strand == 1)
                    sbjct_end = sbjct_start + sub_sbjct.length - 1;
                else    
                    sbjct_end = sbjct_start - sub_sbjct.length + 1;
                
                query_title = 'Query ' + query_start + ' ';
                sbjct_title = 'Sbjct ' + sbjct_start + ' ';
                query_title_len = query_title.length;
                sbjct_title_len = sbjct_title.length;
                //Make sure the indents are the same for query, match and sbjct
                if (query_title_len < sbjct_title_len) {
                    query_title = string.pad(query_title, sbjct_title_len, ' ', true);
                }
                else if (query_title_len > sbjct_title_len) {
                    sbjct_title = string.pad(sbjct_title, query_title_len, ' ', true);
                    sbjct_title_len = query_title_len;
                }
                match_title = string.rep(' ', sbjct_title_len);
                
                block += query_title + query.substring(align_start, align_start + 50) + ' ' + query_end +'\n' 
                     + match_title + match_str.substring(align_start, align_start + 50) + '\n' 
                    + sbjct_title + subject.substring(align_start, align_start + 50) + ' ' + sbjct_end + '\n\n';
                align_start += 50;
                query_start = query_end + 1;
                if (strand == 1)
                    sbjct_start = sbjct_end + 1;
                else
                    sbjct_start = sbjct_end - 1;
            }
            block += '</pre>';

            return block;
        },

        _showDialog: function(feature, content) {
            var sequenceDialog = new Dialog({
                title: 'Alignment for ' + feature.get('id'),
                content: content
            });
            
            sequenceDialog.show();
        },

        //Get alignemts information from the file and store it into alignments object
        _renderAlignments: function(feature, seq) {
            var subfeatures = feature.get('subfeatures'),
                match_num = feature.get('blockcount'),
                featureStart = Number(feature.get('start')),
                featureEnd = Number(feature.get('end')),
                query_size = feature.get('ochrom_size'),
                query_starts = feature.get('ochrom_starts'),
                strand = feature.get('strand'),
                query_seq = feature.get('sequence on other chromosome'),
                query_name = feature.get('Name'),
                alignments = {
                    'seqid' : feature.get('seq_id'),
                    'length' : featureEnd - featureStart + 1,
                    'match_num' : match_num,
                    'start' : featureStart,
                    'end' : featureEnd,
                    'strand' :  feature.get('strand'),
                    'matches' : []
                },
                match_part,
                match_str,
                i,j;
            for (i = 0; i < match_num; i++) {
                var subfeatureStart = Number(subfeatures[i].get('start')),
                    subfeatureEnd = Number(subfeatures[i].get('end')),
                    query_len = subfeatureEnd - subfeatureStart,
                    query_start, query_end,
                    subject = seq.substring(subfeatureStart - featureStart, subfeatureEnd - featureStart);
                if (strand == -1) {
                    query_end = query_size - query_starts[i];
                    query_start = query_end - query_len;
                    subject = Util.revcom(subject);
                    sub_start = subfeatureEnd;
                    sub_end = subfeatureStart + 1;
                }
                else {
                    query_start = Number(query_starts[i]);
                    query_end = query_start + query_len;
                    sub_start = subfeatureStart + 1;
                    sub_end = subfeatureEnd;  
                }
                query = query_seq.substring(query_start, query_end);
                match_str = '';
                subject = subject.toLowerCase();
                query = query.toLowerCase();
                for (j = 0; j < query_len; j++) {
                    if (subject[j] == query[j])
                        match_str += '|';
                    else    
                        match_str += ' ';
                    //console.log(i);
                }
                match_part = {
                    'subject' : subject,
                    'query_name' : query_name,
                    'query' : query,
                    'match' : match_str,
                    'sub_start' : sub_start,
                    'sub_end' : sub_end,
                    'query_start' :  query_start,
                    'query_end' : query_end
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
                var alignments = track._renderAlignments(feature, seq);
                
                var content = track._renderHTML(alignments);
                track._showDialog(feature, content);
            });
                });
        };
        },
        
        _displayOverlaps: function(feature) {
            var overlap = feature.get('overlap'); 
            if (overlap.length == 0) {
                return 'blue';
            } 
            return 'red';
        },

        constructor: function() {
            var config = this.config;
            config.menuTemplate.push({
                'label' : 'View alignment',
                'iconClass' : 'dijitIconDatabase',
                'action' : this._getAlignmentsFunc(this)
            });
            config.menuTemplate.push({
                'label' : 'Color Scheme',
                'iconClass' : 'dijitIconDatabase',
                'title' : 'Color Scheme',
                'action' : 'contentDialog',
                'content' : function(){return 'Red (score > 500)<br> Brown (score >= 200)<br> Pink (score >= 80) <br> Green (score >= 50)<br> Blue (score >= 40)';}
            });
            //config.style.color = this._displayOverlaps;
            config.glyph = 'G-OnRamp_plugin/BlastHit';
        }
    }); 
}  
);
