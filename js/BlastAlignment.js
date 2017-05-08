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
                header = '<h1>' + seq_id + ' Length = ' + length + 
            ' Matches = ' + match_num + '</h1>',
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
                alignment_blocks += this._getMatches(seq_id, match_part, start);
            }
            domConstruct.create('div', {
                innerHTML: alignment_blocks
            }, region, 'after');

            return container;
        }, 

        _getMatches: function(seq_id, match_part) {
            var query_name = match_part['query_name'],
                identities = match_part['identities'],
                positives = match_part['positives'],
                gaps = match_part['gaps'],
                query = match_part['query'],
                match_str = match_part['match'],
                subject_str = match_part['subject'],
                sbjct_start = match_part['sub_start'],
                sbjct_end = match_part['sub_end'],
                query_start = parseInt(query_name.split(' ')[1], 10),
                sub_len = match_part['sub_end'] - match_part['sub_start'] + 1,
                iden_percent = number.round(parseInt(identities, 10) / parseInt(sub_len, 10) * 100),
                posi_percent = number.round(parseInt(positives, 10) / parseInt(sub_len, 10) * 100),
                gaps_percent = number.round(parseInt(gaps, 10) / parseInt(sub_len, 10) * 100),
                match_header = '<h3>' + seq_id + ' ' + sbjct_start + ' ' + sbjct_end + 
                '  Query = ' + query_name + 
                '  Score = ' + match_part['score'] + '  Expect = ' + match_part['expect'] +
                '  Identities = ' + identities + ' / ' + sub_len + ' (' + iden_percent + '%) ' + 
                '  Positives = ' + positives + ' / ' + sub_len + ' (' + posi_percent + '%) ' +
                '  Gaps = ' + gaps + ' / ' + sub_len + ' (' + gaps_percent + '%) ' + 
                '  Frame = ' + match_part['frame'] +'</h3>',
                align_block = this._getAlignBlock(query, match_str, subject_str, query_start, sbjct_start);

            return match_header + align_block;
        },

        _getAlignBlock: function(query, match_str, subject, query_start, sbjct_start) {
            var align_len = query.length,
                align_start = 0,
                query_end,
                sbjct_end,
                sub_query,
                sub_sbjct,
                match_title,
                query_title, query_title_len,
                sbjct_title, sbjct_title_len,
                block = '<pre>';

            while (align_start < align_len) {
                sub_query = query.substring(align_start, align_start + 60);
                sub_sbjct = subject.substring(align_start, align_start + 60);
                query_end = query_start + sub_query.replace(/-/g, '').length - 1;
                //sbjct length needs to multiple by 3 for tablstn
                //TODO: consider blastn, blastp and blastx
                sbjct_end = sbjct_start + sub_sbjct.replace(/-/g, '').length * 3 - 1;
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
                block += query_title + query.substring(align_start, align_start + 60) + ' ' + query_end +'\n' 
                     + match_title + match_str.substring(align_start, align_start + 60) + '\n' 
                    + sbjct_title + subject.substring(align_start, align_start + 60) + ' ' + sbjct_end + '\n\n';
                align_start += 60;
                query_start = query_end + 1;
                sbjct_start = sbjct_end + 1;
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
        _renderAlignments: function(feature) {
            var subfeatures = feature.get('subfeatures'),
                match_num = feature.get('match_num'),
                start = feature.get('start'),
                alignments = {
                    'seqid' : feature.get('seq_id'),
                    'length' : feature.get('end') - start + 1,
                    'match_num' : feature.get('match_num'),
                    'start' : start,
                    'matches' : []
                },
                match_part,
                i;
                
            for (i = 0; i < match_num; i++) {
                match_part = {
                    'subject' : subfeatures[i].get('subject'),
                    'query' : subfeatures[i].get('query'),
                    'query_name' : subfeatures[i].get('Target'),
                    'match' : subfeatures[i].get('match'),
                    'identities' : subfeatures[i].get('identities'),
                    'positives' : subfeatures[i].get('positives'),
                    'gaps' : parseInt(subfeatures[i].get('gaps'), 10),
                    'score' : subfeatures[i].get('score'),
                    'expect' : subfeatures[i].get('expect'),
                    'frame' : subfeatures[i].get('frame'),
                    'sub_start' : subfeatures[i].get('start') + 1,
                    'sub_end' : subfeatures[i].get('end')
                };
                alignments['matches'].push(match_part);
            }
            return alignments;
        },

        _getAlignmentsFunc: function(track) {
            return function() {
                var feature = this.feature;
                var alignments = track._renderAlignments(feature);
                
                var content = track._renderHTML(alignments);
                track._showDialog(feature, content);
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
