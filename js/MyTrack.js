define(["dojo/_base/declare", "JBrowse/Util", "dojo/_base/lang", "JBrowse/View/Track/CanvasFeatures", "JBrowse/Store/SeqFeature", 'dojo/Deferred', 'dojo/DeferredList'],
    function(declare, Util, lang, CanvasFeatures, SeqFeature, Deferred, DeferredList) {
    return declare(CanvasFeatures, {
        _trackMenuOptions: function() {
           // this function is from http://searchvoidstar.tumblr.com/post/153010503488/creating-a-jbrowse-plugin/embed
            var opts=this.inherited(arguments); //call the parent classes function
            opts.push( // add an extra menu item to the array returned from parent class function
                {        
                    label: "Custom item",
                    type: "dijit/CheckedMenuItem",
                    onClick: function(event) {
                        console.log('Clicked');
                    },  
                    iconClass: "dijitIconPackage"
                }   
            );  
            return opts;
        },  

        getSequence: function(track,feature) { 
            var fullseq = ''; 
            var refSeqStore = track.browser.getStore('refseqs', dojo.hitch(this, function(refSeqStore) { 
                if (refSeqStore) {
                    refSeqStore.getReferenceSequence(
                        {ref:feature.get('seq_id'),
                        start:feature.get('start'),
                        end:feature.get('end')},
                        dojo.hitch(this, function(seq) { 
                            alert(seq);
                            fullseq = fullseq.concat(seq); 
                        }),
                        function(){});
                    }
                else{
                    console.log("no refseqstore");
                }
            })); 
                return fullseq;
        },

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
    }); 
    }  
);

