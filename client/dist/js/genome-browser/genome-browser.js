/**
 * Created by agaor on 14/08/17.
 */
class ChromosomePanel {
    constructor(args) {
        Object.assign(this, Backbone.Events);

        this.id = Utils.genId('ChromosomePanel');
        this.target;
        this.autoRender = true;
        this.client;

        this.pixelBase = 0;
        this.species = 'hsapiens'; // change to config species
        this.width = 600;
        this.height = 75;
        this.collapsed = false;
        this.collapsible = false;
        this.hidden = false;

        //set instantiation args, must be last
        Object.assign(this, args);

        //set own region object
        this.region = new Region(this.region);

        this.lastChromosome = "";
        this.data = null;

        this.on(this.handlers);

        this.regionChanging = false;

        this.rendered = false;
        if (this.autoRender) {
            this.render();
        }
    }

    show() {
        $(this.div).css({display: 'block'});
        this.hidden = false;
    }

    hide() {
        $(this.div).css({display: 'none'});
        this.hidden = true;
    }

    setVisible(bool) {
        if (bool) {
            this.show()
        } else {
            this.hide()
        }
    }

    showContent() {
        $(this.svg).css({display: 'inline'});
        this.collapsed = false;
        $(this.collapseDiv).removeClass('active');
        $(this.collapseDiv).children().first().removeClass('fa-plus');
        $(this.collapseDiv).children().first().addClass('fa-minus');
    }

    hideContent() {
        $(this.svg).css({display: 'none'});
        this.collapsed = true;
        $(this.collapseDiv).addClass('active');
        $(this.collapseDiv).children().first().removeClass('fa-minus');
        $(this.collapseDiv).children().first().addClass('fa-plus');
    }

    setTitle(title) {
        if ('titleDiv' in this) {
            $(this.titleTextDiv).html(title);
        }
    }

    setWidth(width) {
        this.width = width;
        this.svg.setAttribute("width", width);
//        this.tracksViewedRegion = this.width / Utils.getPixelBaseByZoom(this.zoom);

        if (typeof this.data !== 'undefined') {
            this.clean();
            this._drawSvg(this.data);
        }
    }

    render() {
        let _this = this;

        this.div = $('<div id="chromosome-panel"></div>')[0];

        if ('title' in this && this.title !== '') {
            var titleDiv = $('<div id="tl-title" class="ocb-gv-panel-title unselectable"></div>')[0];
            $(this.div).append(titleDiv);

            if (this.collapsible == true) {
                this.collapseDiv = $('<div class="ocb-gv-panel-collapse-control"><span class="fa fa-minus"></span></div>');
                $(titleDiv).dblclick(function () {
                    if (_this.collapsed) {
                        _this.showContent();
                    } else {
                        _this.hideContent();
                    }
                });
                $(this.collapseDiv).click(function () {
                    if (_this.collapsed) {
                        _this.showContent();
                    } else {
                        _this.hideContent();
                    }
                });
                $(titleDiv).append(this.collapseDiv);
            }

            this.titleTextDiv = $('<div class="ocb-gv-panel-text">' + this.title + '</div>');
            $(titleDiv).append(this.titleTextDiv);
        }

        this.svg = SVG.init(this.div, {
            "width": this.width,
            "height": this.height
        });
        $(this.div).addClass('unselectable');

        this.colors = {gneg: "#eeeeee", stalk: "#666666", gvar: "#CCCCCC", gpos25: "silver", gpos33: "lightgrey", gpos50: "gray", gpos66: "dimgray", gpos75: "darkgray", gpos100: "black", gpos: "gray", acen: "blue", clementina: '#ffc967'};


        this.setVisible(!this.hidden);
        this.rendered = true;
    }

    setSpecies(species) {
        this.species = species;
    }

    clean() {
        $(this.svg).empty();
    }

    draw(data) {
        let _this = this;
        this.targetDiv = ( this.target instanceof HTMLElement ) ? this.target : document.querySelector('#' + this.target);
        if (!this.targetDiv) {
            console.log('target not found');
            return;
        }
        this.targetDiv.appendChild(this.div);

        this.clean();

        if (UtilsNew.isUndefinedOrNull(data)) {
            this.client.get("genomic", "chromosome", this.region.chromosome, "info")
                .then(function (data) {
                    _this.data = data.response[0].result[0].chromosomes[0];
                    _this.data.cytobands.sort(function (a, b) {
                        return (a.start - b.start);
                    });
                    _this._drawSvg(_this.data);
                });

        } else{
            _this._drawSvg(_this.data);
        }

        this.lastChromosome = this.region.chromosome;

        if (this.collapsed) {
            _this.hideContent();
        }
    }

    _drawSvg(chromosome) {
        // This method uses less svg elements
        let _this = this;
        let offset = 20;
        let group = SVG.addChild(_this.svg, "g", {"cursor": "pointer"});
        this.chromosomeLength = chromosome.size;
        this.pixelBase = (this.width - 40) / this.chromosomeLength;

        /**/
        /*Draw Chromosome*/
        /**/
        let backrect = SVG.addChild(group, 'rect', {
            'x': offset,
            'y': 39,
            'width': this.width - 40 + 1,
            'height': 22,
            'fill': '#555555'
        });

        let cytobandsByStain = {};
        let textDrawingOffset = offset;
        for (let i = 0; i < chromosome.cytobands.length; i++) {
            let cytoband = chromosome.cytobands[i];
            cytoband.pixelStart = cytoband.start * this.pixelBase;
            cytoband.pixelEnd = cytoband.end * this.pixelBase;
            cytoband.pixelSize = cytoband.pixelEnd - cytoband.pixelStart;

            if (typeof cytobandsByStain[cytoband.stain] == 'undefined') {
                cytobandsByStain[cytoband.stain] = [];
            }
            cytobandsByStain[cytoband.stain].push(cytoband);

            let middleX = textDrawingOffset + (cytoband.pixelSize / 2);
            let textY =35;
            let text = SVG.addChild(group, "text", {
                "x": middleX,
                "y": textY,
                "font-size": 10,
                "transform": "rotate(-90, " + middleX + ", " + textY + ")",
                "fill": "black"
            });
            text.textContent = cytoband.name;
            textDrawingOffset += cytoband.pixelSize;
        }

        for (let cytobandStain in cytobandsByStain) {
            let cytobands_d = '';
            if (cytobandStain != 'acen') {
                for (let j = 0; j < cytobandsByStain[cytobandStain].length; j++) {
                    let cytoband = cytobandsByStain[cytobandStain][j];
                    cytobands_d += 'M' + (cytoband.pixelStart + offset + 1) + ',50' + ' L' + (cytoband.pixelEnd + offset) + ',50 ';
                }
                let path = SVG.addChild(group, 'path', {
                    "d": cytobands_d,
                    "stroke": this.colors[cytobandStain],
//                "stroke": 'red',
                    "stroke-width": 20,
                    "fill": 'none'
                });
            }
        }

        if (typeof cytobandsByStain['acen'] !== 'undefined') {
            let firstStain = cytobandsByStain['acen'][0];
            let lastStain = cytobandsByStain['acen'][1];
            let backrect = SVG.addChild(group, 'rect', {
                'x': (firstStain.pixelStart + offset + 1),
                'y': 39,
                'width': (lastStain.pixelEnd + offset) - (firstStain.pixelStart + offset + 1),
                'height': 22,
                'fill': 'white'
            });
            let firstStainXStart = (firstStain.pixelStart + offset + 1);
            let firstStainXEnd = (firstStain.pixelEnd + offset);
            let lastStainXStart = (lastStain.pixelStart + offset + 1);
            let lastStainXEnd = (lastStain.pixelEnd + offset);
            let path = SVG.addChild(group, 'path', {
                'd': 'M' + firstStainXStart + ',39' + ' L' + (firstStainXEnd - 5) + ',39 ' + ' L' + firstStainXEnd + ',50 ' + ' L ' + (firstStainXEnd - 5) + ',61 ' + ' L ' + firstStainXStart + ',61 z',
                'fill': this.colors['acen']
            });
            path = SVG.addChild(group, 'path', {
                'd': 'M' + lastStainXStart + ',50' + ' L' + (lastStainXStart + 5) + ',39 ' + ' L' + lastStainXEnd + ',39 ' + ' L ' + lastStainXEnd + ',61 ' + ' L ' + (lastStainXStart + 5) + ',61 z',
                'fill': this.colors['acen']
            });
        }


        /**/
        /* Resize elements and events*/
        /**/
        let status = '';
        let centerPosition = _this.region.center();
        let pointerPosition = (centerPosition * _this.pixelBase) + offset;
        $(this.svg).on('mousedown', function (event) {
            status = 'setRegion';
        });

        // selection box, will appear when selection is detected
        this.selBox = SVG.addChild(this.svg, "rect", {
            "x": 0,
            "y": 2,
            "stroke-width": "2",
            "stroke": "deepskyblue",
            "opacity": "0.5",
            "fill": "honeydew"
        });


        let positionBoxWidth = _this.region.length() * _this.pixelBase;
        let positionGroup = SVG.addChild(group, 'g');
        this.positionBox = SVG.addChild(positionGroup, 'rect', {
            'x': pointerPosition - (positionBoxWidth / 2),
            'y': 2,
            'width': positionBoxWidth,
            'height': _this.height - 3,
            'stroke': 'orangered',
            'stroke-width': 2,
            'opacity': 0.5,
            'fill': 'navajowhite',
            'cursor': 'move'
        });
        $(this.positionBox).on('mousedown', function (event) {
            status = 'movePositionBox';
        });


        this.resizeLeft = SVG.addChild(positionGroup, 'rect', {
            'x': pointerPosition - (positionBoxWidth / 2),
            'y': 2,
            'width': 7,
            'height': _this.height - 3,
            'opacity': 0.5,
            'fill': 'orangered',
            'visibility': 'hidden'
        });
        $(this.resizeLeft).on('mousedown', function (event) {
            status = 'resizePositionBoxLeft';
        });

        this.resizeRight = SVG.addChild(positionGroup, 'rect', {
            'x': positionBoxWidth - 5,
            'y': 2,
            'width': 7,
            'height': _this.height - 3,
            'opacity': 0.5,
            'fill': 'orangered',
            'visibility': 'hidden'
        });
        $(this.resizeRight).on('mousedown', function (event) {
            status = 'resizePositionBoxRight';
        });

        $(this.positionBox).off('mouseenter');
        $(this.positionBox).off('mouseleave');

        $(positionGroup).mouseenter(function (event) {
            _this._recalculateResizeControls();
            _this._showResizeControls();
        });
        $(positionGroup).mouseleave(function (event) {
            _this._hideResizeControls();
        });


        /*Remove event listeners*/
        $(this.svg).off('contextmenu');
        $(this.svg).off('mousedown');
        $(this.svg).off('mouseup');
        $(this.svg).off('mousemove');
        $(this.svg).off('mouseleave');

        //Prevent browser context menu
        $(this.svg).contextmenu(function (e) {
            e.preventDefault();
        });
        let downY, downX, moveX, moveY, lastX, increment;

        $(this.svg).mousedown(function (event) {

            downX = (event.clientX - $(this).parent().offset().left); //using parent offset works well on firefox and chrome. Could be because it is a div instead of svg
            _this.selBox.setAttribute("x", downX);
            lastX = _this.positionBox.getAttribute("x");
            if (status == '') {
                status = 'setRegion'
            }
            _this._hideResizeControls();
            $(this).mousemove(function (event) {
                moveX = (event.clientX - $(this).parent().offset().left); //using parent offset works well on firefox and chrome. Could be because it is a div instead of svg
                _this._hideResizeControls();
                let inc = moveX - downX;
                let newWidth = 0;
                switch (status) {
                    case 'resizePositionBoxLeft' :
                        newWidth = parseInt(_this.positionBox.getAttribute("width")) - inc;
                        if (newWidth > 0) {
                            _this.positionBox.setAttribute("x", parseInt(_this.positionBox.getAttribute("x")) + inc);
                            _this.positionBox.setAttribute("width", newWidth);
                        }
                        downX = moveX;
                        break;
                    case 'resizePositionBoxRight' :
                        newWidth = parseInt(_this.positionBox.getAttribute("width")) + inc;
                        if (newWidth > 0) {
                            _this.positionBox.setAttribute("width", newWidth);
                        }
                        downX = moveX;
                        break;
                    case 'movePositionBox' :

                        _this.positionBox.setAttribute("x", parseInt(_this.positionBox.getAttribute("x")) + inc);
                        downX = moveX;
                        break;
                    case 'setRegion':
                    case 'selectingRegion' :
                        status = 'selectingRegion';
                        if (moveX < downX) {
                            _this.selBox.setAttribute("x", moveX);
                        }
                        _this.selBox.setAttribute("width", Math.abs(moveX - downX));
                        _this.selBox.setAttribute("height", _this.height - 3);
                        break;
                }

            });
        });


        $(this.svg).mouseup(function (event) {

            $(this).off('mousemove');
            if (downX != null) {

                switch (status) {
                    case 'resizePositionBoxLeft' :
                    case 'resizePositionBoxRight' :
                    case 'movePositionBox' :
                        if (moveX != null) {
                            let w = parseInt(_this.positionBox.getAttribute("width"));
                            let x = parseInt(_this.positionBox.getAttribute("x"));

                            let pixS = x;
                            let pixE = x + w;
                            let bioS = (pixS - offset) / _this.pixelBase;
                            let bioE = (pixE - offset) / _this.pixelBase;

                            _this._triggerRegionChange({region: new Region({chromosome: _this.region.chromosome, start: bioS, end: bioE}), sender: _this});
                        }
                        break;
                    case 'setRegion' :
                        if (downX > offset && downX < (_this.width - offset)) {
                            let w = _this.positionBox.getAttribute("width");

                            let pixS = downX - (w / 2);
                            let pixE = downX + (w / 2);
                            let bioS = (pixS - offset) / _this.pixelBase;
                            let bioE = (pixE - offset) / _this.pixelBase;

                            _this._triggerRegionChange({region: new Region({chromosome: _this.region.chromosome, start: bioS, end: bioE}), sender: _this});
                        }
                        break;
                    case 'selectingRegion' :
                        let bioS = (downX - offset) / _this.pixelBase;
                        let bioE = (moveX - offset) / _this.pixelBase;
                        let start = Math.min(bioS, bioE);
                        let end = Math.max(bioS, bioE);

                        _this.selBox.setAttribute("width", 0);
                        _this.selBox.setAttribute("height", 0);
                        _this._triggerRegionChange({region: new Region({chromosome: _this.region.chromosome, start: start, end: end}), sender: _this});
                        break;
                }
                status = '';

            }
            downX = null;
            moveX = null;
            lastX = _this.positionBox.getAttribute("x");
        });
        $(this.svg).mouseleave(function (event) {
            $(this).off('mousemove')
            if (lastX != null) {
                _this.positionBox.setAttribute("x", lastX);
            }
            _this.selBox.setAttribute("width", 0);
            _this.selBox.setAttribute("height", 0);
            downX = null;
            moveX = null;
            lastX = null;
            let overPositionBox = false;
            let movingPositionBox = false;
            let selectingRegion = false;
        });
    }

    _triggerRegionChange(event) {
        let _this = this;
        if (!this.regionChanging) {
            this.regionChanging = true;

            /**/
            this._limitRegionToChromosome(event.region);
            this.trigger('region:change', event);
            /**/
            setTimeout(function () {
                _this.regionChanging = false;
            }, 700);
        } else {
            this.updateRegionControls();
        }
    }

    _recalculatePositionBox(region) {
        let genomicLength = region.length();
        let pixelWidth = genomicLength * this.pixelBase;
        let x = (region.start * this.pixelBase) + 20;//20 is the margin
        this.positionBox.setAttribute("x", x);
        this.positionBox.setAttribute("width", pixelWidth);
    }

    _recalculateSelectionBox(region) {
        let genomicLength = region.length();
        let pixelWidth = genomicLength * this.pixelBase;
        let x = (region.start * this.pixelBase) + 20;//20 is the margin
        this.selBox.setAttribute("x", x);
        this.selBox.setAttribute("width", pixelWidth);
    }

    _recalculateResizeControls() {
        let postionBoxX = parseInt(this.positionBox.getAttribute('x'));
        let postionBoxWidth = parseInt(this.positionBox.getAttribute('width'));
        this.resizeLeft.setAttribute('x', postionBoxX - 5);
        this.resizeRight.setAttribute('x', (postionBoxX + postionBoxWidth));
        $(this.resizeLeft).css({"cursor": "ew-resize"});
        $(this.resizeRight).css({"cursor": "ew-resize"});
    }

    _hideResizeControls() {
        this.resizeLeft.setAttribute('visibility', 'hidden');
        this.resizeRight.setAttribute('visibility', 'hidden');
    }

    _showResizeControls() {
        this.resizeLeft.setAttribute('visibility', 'visible');
        this.resizeRight.setAttribute('visibility', 'visible');
    }

    _limitRegionToChromosome(region) {
        region.start = (region.start < 1) ? 1 : region.start;
        region.end = (region.end > this.chromosomeLength) ? this.chromosomeLength : region.end;
    }

    updateRegionControls() {
        this.selBox.setAttribute("width", 0);
        this.selBox.setAttribute("height", 0);
        this._recalculatePositionBox(this.region);
        this._recalculateResizeControls();
    }

    setRegion(region) {//item.chromosome, item.region

        console.log('region modified chromosome')
        this.region.load(region);
        let needDraw = false;

        if (this.lastChromosome != this.region.chromosome) {
            needDraw = true;
        }
        if (needDraw) {
            this.draw();
        }

        this.updateRegionControls();
    }

    setCellBaseHost(host) {
        this.cellBaseHost = host;
    }
}
var CELLBASE_HOST = "bioinfo.hpc.cam.ac.uk/cellbase";
var CELLBASE_VERSION = "v4";

var OPENCGA_HOST = "bioinfo.hpc.cam.ac.uk/hgva";
var OPENCGA_USER = "";
var OPENCGA_PASSWORD = "";


const CODON_CONFIG = {
    "": {text: "", color: "transparent"},
    "R": {text: "Arg", color: "#BBBFE0"},
    "H": {text: "His", color: "#BBBFE0"},
    "K": {text: "Lys", color: "#BBBFE0"},

    "D": {text: "Asp", color: "#F8B7D3"},
    "E": {text: "Glu", color: "#F8B7D3"},

    "F": {text: "Phe", color: "#FFE75F"},
    "L": {text: "Leu", color: "#FFE75F"},
    "I": {text: "Ile", color: "#FFE75F"},
    "M": {text: "Met", color: "#FFE75F"},
    "V": {text: "Val", color: "#FFE75F"},
    "P": {text: "Pro", color: "#FFE75F"},
    "A": {text: "Ala", color: "#FFE75F"},
    "W": {text: "Trp", color: "#FFE75F"},
    "G": {text: "Gly", color: "#FFE75F"},


    "T": {text: "Thr", color: "#B3DEC0"},
    "S": {text: "Ser", color: "#B3DEC0"},
    "Y": {text: "Tyr", color: "#B3DEC0"},
    "Q": {text: "Gln", color: "#B3DEC0"},
    "N": {text: "Asn", color: "#B3DEC0"},
    "C": {text: "Cys", color: "#B3DEC0"},

    "X": {text: " X ", color: "#f0f0f0"},
    "*": {text: " * ", color: "#DDDDDD"}
};

const GENE_BIOTYPE_COLORS = {
    "3prime_overlapping_ncrna": "Orange",
    "ambiguous_orf": "SlateBlue",
    "antisense": "SteelBlue",
    "disrupted_domain": "YellowGreen",
    "IG_C_gene": "#FF7F50",
    "IG_D_gene": "#FF7F50",
    "IG_J_gene": "#FF7F50",
    "IG_V_gene": "#FF7F50",
    "lincRNA": "#8b668b",
    "miRNA": "#8b668b",
    "misc_RNA": "#8b668b",
    "Mt_rRNA": "#8b668b",
    "Mt_tRNA": "#8b668b",
    "ncrna_host": "Fuchsia",
    "nonsense_mediated_decay": "seagreen",
    "non_coding": "orangered",
    "non_stop_decay": "aqua",
    "polymorphic_pseudogene": "#666666",
    "processed_pseudogene": "#666666",
    "processed_transcript": "#0000ff",
    "protein_coding": "#a00000",
    "pseudogene": "#666666",
    "retained_intron": "goldenrod",
    "retrotransposed": "lightsalmon",
    "rRNA": "indianred",
    "sense_intronic": "#20B2AA",
    "sense_overlapping": "#20B2AA",
    "snoRNA": "#8b668b",
    "snRNA": "#8b668b",
    "transcribed_processed_pseudogene": "#666666",
    "transcribed_unprocessed_pseudogene": "#666666",
    "unitary_pseudogene": "#666666",
    "unprocessed_pseudogene": "#666666",
    // "": "orangered",
    "other": "#000000"
};

const SNP_BIOTYPE_COLORS = {
    "2KB_upstream_variant": "#a2b5cd",
    "5KB_upstream_variant": "#a2b5cd",
    "500B_downstream_variant": "#a2b5cd",
    "5KB_downstream_variant": "#a2b5cd",
    "3_prime_UTR_variant": "#7ac5cd",
    "5_prime_UTR_variant": "#7ac5cd",
    "coding_sequence_variant": "#458b00",
    "complex_change_in_transcript": "#00fa9a",
    "frameshift_variant": "#ff69b4",
    "incomplete_terminal_codon_variant": "#ff00ff",
    "inframe_codon_gain": "#ffd700",
    "inframe_codon_loss": "#ffd700",
    "initiator_codon_change": "#ffd700",
    "non_synonymous_codon": "#ffd700",
    "intergenic_variant": "#636363",
    "intron_variant": "#02599c",
    "mature_miRNA_variant": "#458b00",
    "nc_transcript_variant": "#32cd32",
    "splice_acceptor_variant": "#ff7f50",
    "splice_donor_variant": "#ff7f50",
    "splice_region_variant": "#ff7f50",
    "stop_gained": "#ff0000",
    "stop_lost": "#ff0000",
    "stop_retained_variant": "#76ee00",
    "synonymous_codon": "#76ee00",
    "other": "#000000"
};

const SEQUENCE_COLORS = {A: "#009900", C: "#0000FF", G: "#857A00", T: "#aa0000", N: "#555555"};

const SAM_FLAGS = [
    ["read paired", 0x1],
    ["read mapped in proper pair", 0x2],
    ["read unmapped", 0x4],
    ["mate unmapped", 0x8],
    ["read reverse strand", 0x10],
    ["mate reverse strand", 0x20],
    ["first in pair", 0x40],
    ["second in pair", 0x80],
    ["not primary alignment", 0x100],
    ["read fails platform/vendor quality checks", 0x200],
    ["read is PCR or optical duplicate", 0x400]
];

const FEATURE_TYPES = {

    //methods
    formatTitle: function (str) {
        let s = str;
        if (str) {
            str.replace(/_/gi, " ");
            s = s.charAt(0).toUpperCase() + s.slice(1);
        }
        return s;
    },
    getTipCommons: function (f) {
        let strand = (f.strand !== null) ? f.strand : "NA";
        return `start-end:&nbsp;<span style="font-weight: bold">${f.start}-${f.end} (${strand})</span><br>` +
            `length:&nbsp;<span style="font-weight: bold; color:#005fdb">${(f.end - f.start + 1).toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")}</span><br>`;
    },
    getTipTitleCommons: function (f) {
        let tokens = [];
        if (f.featureType) {
            tokens.push(f.featureType);
        }
        if (f.id) {
            tokens.push(f.id);
        }
        if (f.name) {
            tokens.push(f.name);
        }
        return tokens.join(" - ");
    },
    getLabelCommons: function (f) {
        let tokens = [];
        if (f.id) {
            tokens.push(f.id);
        }
        if (f.name) {
            tokens.push(f.name);
        }
        return tokens.join(" - ");
    },
    _getSimpleKeys: function (f) {
        let s = "";
        for (let key in f) {
            if (key == "start" || key == "end" || key == "id" || key == "name" || key == "length") {
                continue;
            }
            if (_.isNumber(f[key]) || _.isString(f[key])) {
                s += key + ":&nbsp;<span style=\"font-weight: bold\">" + f[key] + "</span><br>";
            }
        }
        return s;
    },

    //items
    sequence: {
        color: SEQUENCE_COLORS
    },
    undefined: {
        label: function (f) {
            let str = "";
            str += f.chromosome + ":" + f.start + "-" + f.end;
            return str;
        },
        tooltipTitle: function (f) {
            return FEATURE_TYPES.getTipTitleCommons(f);
        },
        tooltipText: function (f) {
            return FEATURE_TYPES.getTipCommons(f) + FEATURE_TYPES._getSimpleKeys(f);
        },
        color: "#aaa",
        infoWidgetId: "id",
        height: 10,
        histogramColor: "lightgray"
    },
    gene: {
        label: function (f) {
            let name = (f.name != null) ? f.name : f.id;
            let str = "";
            str += (f.strand < 0 || f.strand == "-") ? "<" : "";
            str += " " + name + " ";
            str += (f.strand > 0 || f.strand == "+") ? ">" : "";
            if (f.biotype != null && f.biotype != "") {
                str += " [" + f.biotype + "]";
            }
            return str;
        },
        tooltipTitle: function (f) {
            let name = (f.name !== null) ? f.name : f.id;
            return FEATURE_TYPES.formatTitle("Gene") + " - <span class=\"ok\">" + name + "</span>";
        },
        tooltipText: function (f) {
            let color = GENE_BIOTYPE_COLORS[f.biotype];
            return "id:&nbsp;<span class=\"ssel\">" + f.id + "</span><br>" +
                "biotype:&nbsp;<span class=\"emph\" style=\"color:" + color + ";\">" + f.biotype + "</span><br>" +
                FEATURE_TYPES.getTipCommons(f) +
                "source:&nbsp;<span class=\"ssel\">" + f.source + "</span><br><br>" +
                "description:&nbsp;<span class=\"emph\">" + f.description + "</span><br>";
        },
        color: function (f) {
            return GENE_BIOTYPE_COLORS[f.biotype];
        },
        infoWidgetId: "id",
        height: 4,
        histogramColor: "lightblue"
    },
    snp: {
        label: function (f) {
            let change = f.reference + " > " + f.alternate;
            let name = "";
            if("name" in f){
                name += f.name;
            }else if("id" in f){
                name += f.id;
            }
            return name + " " + change;
        },
        tooltipTitle: function (f) {
            let change = f.reference + " > " + f.alternate;
            let name = "";
            if("name" in f){
                name += f.name;
            }else if("id" in f){
                name += f.id;
            }
            return "SNP" + " - <span class=\"ok\">" +  name + " " + change + "</span>";
        },
        tooltipText: function (f) {
            let mafString = "N/A";
            if (typeof f.annotation.minorAlleleFreq !== "undefined") {
                mafString = f.annotation.minorAlleleFreq + " (" + f.annotation.minorAllele + ")";
            }
            return "alleles:&nbsp;<span class=\"ssel\">" + f.reference + "/" + f.alternate + "</span><br>"
                + FEATURE_TYPES.getTipCommons(f)
                + "conseq. type :&nbsp;<span class=\"ssel\">" + f.annotation.displayConsequenceType + "</span><br>"
                + "1000G MAF:&nbsp;<span class=\"ssel\">" + mafString + "</span><br>";

        },
        color: function (f) {
            return SNP_BIOTYPE_COLORS[f.annotation.displayConsequenceType];
        },
        infoWidgetId: "id",
        strokeColor: "#555",
        height: 8,
        histogramColor: "orange"
    },
    vcf: {
        label: function (f) {
            return f.id;
        },
        tooltipTitle: function (f) {
            return "VCF variant - <span class=\"ok\">" + f.id + "</span>";
        },
        tooltipText: function (f) {
            return "alleles (ref/alt):&nbsp;<span class=\"emph\">" + f.reference + "/" + f.alternate + "</span><br>" +
                "quality:&nbsp;<span class=\"emph\">" + f.quality + "</span><br>" +
                "filter:&nbsp;<span class=\"emph\">" + f.filter + "</span><br>" +
                FEATURE_TYPES.getTipCommons(f);
        },
        color: function (f) {
            return "black";
        },
        infoWidgetId: "id",
        height: 8,
        histogramColor: "gray"
    },
    gff2: {
        label: function (f) {
            let str = "";
            str += f.label;
            return str;
        },
        tooltipTitle: function (f) {
            return f.featureType.toUpperCase() +
                " - <span class=\"ok\">" + f.label + "</span>";
        },
        tooltipText: function (f) {
            return "score:&nbsp;<span class=\"emph\">" + f.score + "</span><br>" +
                "frame:&nbsp;<span class=\"emph\">" + f.frame + "</span><br>" +
                FEATURE_TYPES.getTipCommons(f);
        },
        getColor: function (f) {
            return "black";
        },
        height: 8,
        histogramColor: "gray"
    },
    gff3: {
        label: function (f) {
            let str = "";
            str += f.label;
            return str;
        },
        tooltipTitle: function (f) {
            return f.featureType.toUpperCase() +
                " - <span class=\"ok\">" + f.label + "</span>";
        },
        tooltipText: function (f) {
            return "score:&nbsp;<span class=\"emph\">" + f.score + "</span><br>" +
                "frame:&nbsp;<span class=\"emph\">" + f.frame + "</span><br>" +
                FEATURE_TYPES.getTipCommons(f);
        },
        color: function (f) {
            return "black";
        },
        height: 8,
        histogramColor: "gray",
        infoWidgetId: "id",
        handlers: {
            "feature:mouseover": function (e) {
                console.log(e)
            },
            "feature:click": function (e) {
                console.log(e)
            }
        }
    },
    gtf: {
        label: function (f) {
            let str = "";
            str += f.label;
            return str;
        },
        tooltipTitle: function (f) {
            return f.featureType.toUpperCase() +
                " - <span class=\"ok\">" + f.label + "</span>";
        },
        tooltipText: function (f) {
            return "score:&nbsp;<span class=\"emph\">" + f.score + "</span><br>" +
                "frame:&nbsp;<span class=\"emph\">" + f.frame + "</span><br>" +
                FEATURE_TYPES.getTipCommons(f);
        },
        color: function (f) {
            return "black";
        },
        height: 8,
        histogramColor: "gray",
        infoWidgetId: "id",
        handlers: {
            "feature:mouseover": function (e) {
                console.log(e)
            },
            "feature:click": function (e) {
                console.log(e)
            }
        }
    },
    bed: {
        label: function (f) {
            let str = "";
            str += f.label;
            return str;
        },
        tooltipTitle: function (f) {
            return FEATURE_TYPES.formatTitle(f.featureType);
        },
        tooltipText: function (f) {
            return FEATURE_TYPES.getTipCommons(f);
        },
        color: function (f) {
            //XXX convert RGB to Hex
            let rgbColor = new Array();
            rgbColor = f.itemRgb.split(",");
            let hex = function (x) {
                let hexDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
                return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
            };
            let hexColor = hex(rgbColor[0]) + hex(rgbColor[1]) + hex(rgbColor[2]);
            return "#" + hexColor;
        },
        height: 8,
        histogramColor: "orange",
        infoWidgetId: "id",
        handlers: {
            "feature:mouseover": function (e) {
                console.log(e);
            },
            "feature:click": function (e) {
                console.log(e);
            }
        }
    },
    bam: {
        explainFlags: function (flags) {
            let summary = "<div style=\"background:#FFEF93;font-weight:bold;\">flags : <span>" + flags + "</span></div>";
            for (let i = 0; i < SAM_FLAGS.length; i++) {
                if (SAM_FLAGS[i][1] & flags) {
                    summary += SAM_FLAGS[i][0] + "<br>";
                }
            }
            return summary;
        },
        label: function (f) {
            return "Read  " + f.chromosome + ":" + f.start + "-" + f.end;
        },
        tooltipTitle: function (f) {
            return "Read" + " - <span class=\"ok\">" + f.QNAME + "</span>";
        },
        tooltipText: function (f) {
            f.strand = this.strand(f);
            let cigar = "";
            for (let i = 0; i < f.differences.length; i++) {
                let d = f.differences[i];
                cigar += d.length + d.op;
            }

            let one = "CIGAR:&nbsp;<b>" + cigar + "</b><br>" +
                "TLEN:&nbsp;<b>" + f.TLEN + "</b><br>" +
                "RNAME:&nbsp;<b>" + f.RNAME + "</b><br>" +
                "POS:&nbsp;<b>" + f.POS + "</b><br>" +
                "MAPQ:&nbsp;<b>" + f.MAPQ + "</b><br>" +
                "RNEXT:&nbsp;<b>" + f.RNEXT + "</b><br>" +
                "PNEXT:&nbsp;<b>" + f.PNEXT + "</b><br>" +
                FEATURE_TYPES.getTipCommons(f) + "<br>" +
                this.explainFlags(f.FLAG)+ "<br>";

            let three = "<div style=\"background:#FFEF93;font-weight:bold;\">Optional fields</div>";
            for (let key in f.OPTIONAL) {
                three += key + ":" + f.OPTIONAL[key] + "<br>";
            }
            let style = "background:#FFEF93;font-weight:bold;";
            return "<div>" + one + "</div>" +
                "<div>" + three + "</div>";
        },
        color: function (f, chr) {
            if (f.RNEXT == "=" || f.RNAME == f.RNEXT) {
                return (parseInt(f.FLAG) & (0x10)) == 0 ? "DarkGray" : "LightGray";
            }else{
                return "lightgreen";
            }
        },
        strokeColor: function (f) {
            if (this.mateUnmappedFlag(f)) {
                return "tomato";
            }
            return (parseInt(f.FLAG) & (0x10)) == 0 ? "LightGray" : "DarkGray";
        },
        strand: function (f) {
            return (parseInt(f.FLAG) & (0x10)) == 0 ? "Forward" : "Reverse";
        },
        readPairedFlag: function (f) {
            return (parseInt(f.FLAG) & (0x1)) == 0 ? false : true;
        },
        firstOfPairFlag: function (f) {
            return (parseInt(f.FLAG) & (0x40)) == 0 ? false : true;
        },
        mateUnmappedFlag: function (f) {
            return (parseInt(f.FLAG) & (0x8)) == 0 ? false : true;
        },
        infoWidgetId: "id",
        height: 13,
        histogramColor: "grey"
    },
    variantMulti: {
        label: function (f) {
            return f.id;
        },
        tooltipTitle: function (f) {
            return "VCF variant - <span class=\"ok\">" + f.id + "</span>";
        },
        tooltipText: function (f) {
            return "alleles (ref/alt):&nbsp;<span class=\"emph\">" + f.reference + "/" + f.alternate + "</span><br>" +
                "type:&nbsp;<span class=\"emph\">" + f.type + "</span><br>" +
                FEATURE_TYPES.getTipCommons(f);
        },
        color: "#8BC34A",
        infoWidgetId: "id",
        height: 10,
        histogramColor: "gray"
    },
    TF_binding_site: {
        label: function (f) {
            return FEATURE_TYPES.getLabelCommons(f);
        },
        tooltipTitle: function (f) {
            return FEATURE_TYPES.getTipTitleCommons(f);
        },
        tooltipText: function (f) {
            return FEATURE_TYPES.getTipCommons(f) + FEATURE_TYPES._getSimpleKeys(f);
        },
        color: "#58f3f0",
        infoWidgetId: "id",
        height: 10,
        histogramColor: "#58f3f0"
    },
    mirna_target: {
        label: function (f) {
            return FEATURE_TYPES.getLabelCommons(f);
        },
        tooltipTitle: function (f) {
            return FEATURE_TYPES.getTipTitleCommons(f);
        },
        tooltipText: function (f) {
            return FEATURE_TYPES.getTipCommons(f) + FEATURE_TYPES._getSimpleKeys(f);
        },
        color: "#8af688",
        infoWidgetId: "id",
        height: 10,
        histogramColor: "#8af688"
    },
    Histone: {
        label: function (f) {
            return FEATURE_TYPES.getLabelCommons(f);
        },
        tooltipTitle: function (f) {
            return FEATURE_TYPES.getTipTitleCommons(f);
        },
        tooltipText: function (f) {
            return FEATURE_TYPES.getTipCommons(f) + FEATURE_TYPES._getSimpleKeys(f);
        },
        color: "#7a91c7",
        infoWidgetId: "id",
        height: 10,
        histogramColor: "#7a91c7"
    },
    Polymerase: {
        label: function (f) {
            return FEATURE_TYPES.getLabelCommons(f);
        },
        tooltipTitle: function (f) {
            return FEATURE_TYPES.getTipTitleCommons(f);
        },
        tooltipText: function (f) {
            return FEATURE_TYPES.getTipCommons(f) + FEATURE_TYPES._getSimpleKeys(f);
        },
        color: "#44c2d4",
        infoWidgetId: "id",
        height: 10,
        histogramColor: "#44c2d4"
    },
    "Open Chromatin": {
        label: function (f) {
            return FEATURE_TYPES.getLabelCommons(f);
        },
        tooltipTitle: function (f) {
            return FEATURE_TYPES.getTipTitleCommons(f);
        },
        tooltipText: function (f) {
            return FEATURE_TYPES.getTipCommons(f) + FEATURE_TYPES._getSimpleKeys(f);
        },
        color: "#ba56b8",
        infoWidgetId: "id",
        height: 10,
        histogramColor: "#ba56b8"
    },
    "Clinvar": {
        label: function (f) {
            return FEATURE_TYPES.getLabelCommons(f);
        },
        tooltipTitle: function (f) {
            return "Clinvar" + " - " + f.clinvarSet.title;
        },
        tooltipText: function (f) {
            return FEATURE_TYPES.getTipCommons(f) + FEATURE_TYPES._getSimpleKeys(f);
        },
        color: "#d7ff9a",
        infoWidgetId: "id",
        height: 10,
        histogramColor: "#d7ff9a"
    },
    "Cosmic": {
        label: function (f) {
            return FEATURE_TYPES.getLabelCommons(f);
        },
        tooltipTitle: function (f) {
            return "Cosmic";
        },
        tooltipText: function (f) {
            return FEATURE_TYPES.getTipCommons(f) + FEATURE_TYPES._getSimpleKeys(f);
        },
        color: "#009aff",
        infoWidgetId: "id",
        height: 10,
        histogramColor: "#009aff"
    },
    "GWAS": {
        label: function (f) {
            return FEATURE_TYPES.getLabelCommons(f);
        },
        tooltipTitle: function (f) {
            return "GWAS";
        },
        tooltipText: function (f) {
            return FEATURE_TYPES.getTipCommons(f) + FEATURE_TYPES._getSimpleKeys(f);
        },
        color: "#ff6500",
        infoWidgetId: "id",
        height: 10,
        histogramColor: "#ff6500"
    }
};
/*
 * Binary Search Tree implementation in JavaScript
 * Copyright (c) 2009 Nicholas C. Zakas
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * A binary search tree implementation in JavaScript. This implementation
 * does not allow duplicate values to be inserted into the tree, ensuring
 * that there is just one instance of each value.
 * @class BinarySearchTree
 * @constructor
 */
function FeatureBinarySearchTree() {

    /**
     * Pointer to root node in the tree.
     * @property _root
     * @type Object
     * @private
     */
    this._root = null;
}

FeatureBinarySearchTree.prototype = {

    //restore constructor
    constructor: FeatureBinarySearchTree,

    //-------------------------------------------------------------------------
    // Private members
    //-------------------------------------------------------------------------

    /**
     * Appends some data to the appropriate point in the tree. If there are no
     * nodes in the tree, the data becomes the root. If there are other nodes
     * in the tree, then the tree must be traversed to find the correct spot
     * for insertion.
     * @param {variant} value The data to add to the list.
     * @return {Void}
     * @method add
     */
    add: function (v){
        //create a new item object, place data in
        var node = {
                value: v,
                left: null,
                right: null
            },

            //used to traverse the structure
            current;

        //special case: no items in the tree yet
        if (this._root === null){
            this._root = node;
            return true;
        }
        //else
        current = this._root;

        while(true){

            //if the new value is less than this node's value, go left
            if (node.value.end < current.value.start){

                //if there's no left, then the new node belongs there
                if (current.left === null){
                    current.left = node;
                    return true;
//                        break;
                }
                //else
                current = current.left;

                //if the new value is greater than this node's value, go right
            } else if (node.value.start > current.value.end){

                //if there's no right, then the new node belongs there
                if (current.right === null){
                    current.right = node;
                    return true;
//                        break;
                }
                //else
                current = current.right;

                //if the new value is equal to the current one, just ignore
            } else {
                return false;
//                    break;
            }
        }

    },

    contains: function (v){
        var node = {
                value: v,
                left: null,
                right: null
            },
            found = false,
            current = this._root;

        //make sure there's a node to search
        while(!found && current){

            //if the value is less than the current node's, go left
            if (node.value.end < current.value.start){
                current = current.left;

                //if the value is greater than the current node's, go right
            } else if (node.value.start > current.value.end){
                current = current.right;

                //values are equal, found it!
            } else {
                found = true;
            }
        }

        //only proceed if the node was found
        return found;

    },

    // Looks for an element in the binary search tree if present
    get: function(v) {
        var node = {
                value: v,
                left: null,
                right: null
            },
            current = this._root;

        //make sure there's a node to search
        while(current){

            //if the value is less than the current node's, go left
            if (node.value.end < current.value.start){
                current = current.left;

                //if the value is greater than the current node's, go right
            } else if (node.value.start > current.value.end){
                current = current.right;

                //values are equal, found it!
            } else {
                return current;
            }
        }

        //only proceed if the node was found
        return {};
    }
};
class GenomeBrowser {

    constructor(args) {
        Object.assign(this, Backbone.Events);

        this.id = Utils.genId("GenomeBrowser");

        //set default args
        this.autoRender = true;
        this.version = 'Powered by <a target="_blank" href="http://www.opencb.org/">OpenCB</a>';
        this.target;

        this.width = 1;
        this.height = 1;

        this.client;
        this.cellBaseHost = "http://bioinfo.hpc.cam.ac.uk/cellbase";
        this.cellBaseVersion = "v4";

        this.quickSearchResultFn;
        this.quickSearchDisplayKey = "name";

        this.drawNavigationBar = true;
        this.drawKaryotypePanel = true;
        this.drawChromosomePanel = true;
        this.drawOverviewTrackListPanel = true;
        this.overviewZoomMultiplier = 8;
        this.karyotypePanelConfig = {
            hidden: false,
            collapsed: false,
            collapsible: true
        };
        this.chromosomePanelConfig = {
            hidden: false,
            collapsed: false,
            collapsible: true
        };
        this.regionPanelConfig = {
            hidden: false,
            collapsed: false,
            collapsible: true
        };
        this.navigationBarConfig = {};
        this.drawStatusBar = true;
        this.resizable = true;
        this.sidePanel = false;//enable or disable sidePanel at construction
        this.trackListTitle = "Detailed information";//enable or disable sidePanel at construction
        this.trackPanelScrollWidth = 18;

        this.zoom = 1;

        this.chromosomes = [];
        this.chromosomeList = [];

        //set instantiation args, must be last
        Object.assign(this, args);

        this.defaultRegion = new Region(this.region);

        this.sidePanelWidth = (this.sidePanel) ? 25 : 0;

        //events attachments
        this.on(this.handlers);

        this.fullscreen = false;
        this.resizing = false;

        this.changingRegion = false;

        this.rendered = false;
        if (this.autoRender) {
            this.render();
        }
    }

    render() {
        console.log("Initializing Genome Viewer");

        //HTML skel
        this.div = document.createElement("div");
        this.div.setAttribute("id", this.id);
        this.div.setAttribute("class", "ocb-gv ocb-box-vertical");

        this.navigationbarDiv = document.createElement("div");
        this.navigationbarDiv.setAttribute("class", "ocb-gv-navigation");
        this.div.appendChild(this.navigationbarDiv);

        this.centerPanelDiv = document.createElement("div");
        this.centerPanelDiv.setAttribute("class", "ocb-gv-center");
        this.div.appendChild(this.centerPanelDiv);

        this.statusbarDiv = document.createElement("div");
        this.statusbarDiv.setAttribute("class", "ocb-gv-status");
        this.div.appendChild(this.statusbarDiv);


        this.rightSidebarDiv = document.createElement("div");
        this.rightSidebarDiv.setAttribute("class", "ocb-gv-right-side");
        this.centerPanelDiv.appendChild(this.rightSidebarDiv);

        this.leftSidebarDiv = document.createElement("div");
        this.leftSidebarDiv.setAttribute("class", "ocb-gv-left-side");
        this.centerPanelDiv.appendChild(this.leftSidebarDiv);


        this.karyotypeDiv = document.createElement("div");
        this.karyotypeDiv.setAttribute("class", "ocb-gv-karyotype");
        this.centerPanelDiv.appendChild(this.karyotypeDiv);

        this.chromosomeDiv = document.createElement("div");
        this.chromosomeDiv.setAttribute("class", "ocb-gv-chromosome");
        this.centerPanelDiv.appendChild(this.chromosomeDiv);


        this.trackListPanelsDiv = document.createElement("div");
        this.trackListPanelsDiv.setAttribute("class", "ocb-gv-tracklist-target");
        this.centerPanelDiv.appendChild(this.trackListPanelsDiv);

        this.regionDiv = document.createElement("div");
        this.regionDiv.setAttribute("class", "ocb-gv-overview");
        this.trackListPanelsDiv.appendChild(this.regionDiv);

        this.tracksDiv = document.createElement("div");
        this.tracksDiv.setAttribute("class", "ocb-gv-detailed");
        this.trackListPanelsDiv.appendChild(this.tracksDiv);

        if (this.drawOverviewTrackListPanel) {
            this.overviewTrackListPanel = this._createOverviewTrackListPanel(this.regionDiv);
        }
        this.trackListPanel = this._createTrackListPanel(this.tracksDiv);
        this.getChromosomes();
    }

    _init() {
        let _this = this;
        this._checkAndSetMinimumRegion(this.region, this.getSVGCanvasWidth());
        this.zoom = this._calculateZoomByRegion(this.region);

        this._updateSpecies(this.species);

        /* Navigation Bar */
        if (this.drawNavigationBar) {
            this.navigationBar = this._createNavigationBar(this.navigationbarDiv);
        }

        /* karyotype Panel */
        if (this.drawKaryotypePanel) {
            this.karyotypePanel = this._drawKaryotypePanel(this.karyotypeDiv);
        }

        /* Chromosome Panel */
        if (this.drawChromosomePanel) {
            this.chromosomePanel = this._drawChromosomePanel(this.chromosomeDiv);
        }

        /* Region Panel, is a TrackListPanel Class */
        // if (this.drawOverviewTrackListPanel) {
        //     this.overviewTrackListPanel = this._createOverviewTrackListPanel(this.regionDiv);
        // }
        /*TrackList Panel*/
        // this.trackListPanel = this._createTrackListPanel(this.tracksDiv);

        /*Status Bar*/
        if (this.drawStatusBar) {
            this.statusBar = this._createStatusBar(this.statusbarDiv);
        }

        this.on("region:change region:move", function (event) {
            if (event.sender !== _this) {
                _this.region.load(event.region);
            }
        });
        this.on("width:change", function (event) {
            if (event.sender !== _this) {
                _this.width = event.width;
                $(_this.div).width(event.width);
                $(_this.targetDiv).width(event.width);
            }
        });

        $("html").bind("keydown.genomeViewer", function (e) {
            switch (e.keyCode) {
                case 40:    // down arrow
                case 109:   // minus key
                    if (e.shiftKey) {
                        _this.increaseZoom(-10);
                    }
                    break;
                case 38:    // up arrow
                case 107:   // plus key
                    if (e.shiftKey) {
                        _this.increaseZoom(10);
                    }
                    break;
            }
        });
    }

    draw() {
        this.targetDiv = ( this.target instanceof HTMLElement ) ? this.target : document.querySelector('#' + this.target);
        if (!this.targetDiv) {
            console.log("target not found");
            return;
        }
        this.targetDiv.appendChild(this.div);
    }

    destroy() {
        while (this.div.firstChild) {
            this.div.removeChild(this.div.firstChild);
        }
        $(this.div).remove();
        this.off();
        this.rendered = false;
        $("html").unbind(".genomeViewer");
        $("body").unbind(".genomeViewer");
        delete this;
    }

    getChromosomes() {
        let saveChromosomes = function (chromosomeList) {
            let chromosomes = {};
            for (let i = 0; i < chromosomeList.length; i++) {
                let chromosome = chromosomeList[i];
                chromosomes[chromosome.name] = chromosome;
            }
            return chromosomes;
        };

        if (typeof this.chromosomeList !== 'undefined' && this.chromosomeList !== null && this.chromosomeList.length > 0) {
            this.chromosomes = saveChromosomes(this.chromosomeList);
            this.species.chromosomes = this.chromosomes;
        } else {
            let _this = this;

            _this.client.get("genomic", "chromosome", undefined, "search")
                .then(function (response) {
                    let chromosomesOld = _this.chromosomes;
                    _this.chromosomes = saveChromosomes(response.response[0].result[0].chromosomes);
                    if (chromosomesOld !== undefined && chromosomesOld.length === 0) {
                        _this._init();
                        _this.rendered = true;
                    }
                });
        }
    }
    /**/
    /*Components*/
    /**/

    _createNavigationBar(target) {
        let _this = this;

        if (!$.isFunction(this.quickSearchResultFn)) {
            this.quickSearchResultFn = function (query) {
                return _this.client.get("feature", "id", query, "starts_with", { limit: 10 });
            };
        }

        let goFeature = function (feature) {
            _this._regionChangeHandler({region: new Region(feature)});
        };

        let navigationBar = new NavigationBar({
            target: target,
            cellBaseHost: this.cellBaseHost,
            cellBaseVersion: this.cellBaseVersion,
            availableSpecies: this.availableSpecies,
            species: this.species,
            region: this.region,
            width: this.width,
            svgCanvasWidthOffset: this.trackPanelScrollWidth + this.sidePanelWidth,
            zoom: this.zoom,
            quickSearchResultFn: this.quickSearchResultFn,
            quickSearchDisplayKey: this.quickSearchDisplayKey,
            componentsConfig: this.navigationBarConfig.componentsConfig,
            karyotypePanelConfig: this.karyotypePanelConfig,
            chromosomePanelConfig: this.chromosomePanelConfig,
            regionPanelConfig: this.regionPanelConfig,
            handlers: {
                "region:change": function (event) {
                    _this._regionChangeHandler(event);
                },
                "region:move": function (event) {
                    _this._regionMoveHandler(event);
                },
                "zoom:change": function (event) {
                    _this._zoomChangeHandler(event);
                },
                "species:change": function (event) {
                    _this._speciesChangeHandler(event);
                },

                "karyotype-button:change": function (event) {
                    if (event.selected) {
                        _this.karyotypePanel.show();
                    } else {
                        _this.karyotypePanel.hide();
                    }
                },
                "chromosome-button:change": function (event) {
                    if (event.selected) {
                        _this.chromosomePanel.show();
                    } else {
                        _this.chromosomePanel.hide();
                    }
                },
                "region-button:change": function (event) {
                    if (event.selected) {
                        _this.overviewTrackListPanel.show();
                    } else {
                        _this.overviewTrackListPanel.hide();
                    }
                },
                "fullscreen:click": function (event) {
                    if (_this.fullscreen) {
                        $(_this.div).css({width: "auto"});
                        Utils.cancelFullscreen();//no need to pass the dom object;
                        _this.fullscreen = false;
                    } else {
                        $(_this.div).css({width: screen.width});
                        Utils.launchFullScreen(_this.div);
                        _this.fullscreen = true;
                    }
                },
                "restoreDefaultRegion:click": function (event) {
                    event.region = _this.defaultRegion;
                    _this._regionChangeHandler(event);
                },
                "autoHeight-button:change": function (event) {
                    _this.toggleAutoHeight(event.selected);
                },
                "quickSearch:select": function (event) {
                    goFeature(event.item);
                    _this.trigger("quickSearch:select", event);
                },
                "quickSearch:go": function (event) {
                    goFeature(event.item);
                }
            }
        });

        this.on("region:change", function (event) {
            _this.navigationBar.setRegion(event.region, _this.zoom);
        });
        this.on("region:move", function (event) {
            if (event.sender != navigationBar) {
                _this.navigationBar.moveRegion(event.region);
            }
        });
        this.on("width:change", function (event) {
            _this.navigationBar.setWidth(event.width);
        });

        navigationBar.draw();

        return navigationBar;
    }

    _drawKaryotypePanel(target) {
        let _this = this;
        let karyotypePanel = new KaryotypePanel({
            target: target,
            client: this.client,
            cellBaseHost: this.cellBaseHost,
            cellBaseVersion: this.cellBaseVersion,
            width: this.width - this.sidePanelWidth,
            height: 125,
            species: this.species,
            title: "Karyotype",
            collapsed: this.karyotypePanelConfig.collapsed,
            collapsible: this.karyotypePanelConfig.collapsible,
            hidden: this.karyotypePanelConfig.hidden,
            region: this.region,
            autoRender: true,
            handlers: {
                "region:change": function (event) {
                    _this._regionChangeHandler(event);
                }
            }
        });

        this.on("region:change region:move", function (event) {
            karyotypePanel.setRegion(event.region);
        });
        this.on("width:change", function (event) {
            karyotypePanel.setWidth(event.width - _this.sidePanelWidth);
        });

        karyotypePanel.draw();

        return karyotypePanel;
    }

    _drawChromosomePanel(target) {
        let _this = this;
        let chromosomePanel = new ChromosomePanel({
            target: target,
            client: this.client,
            cellBaseHost: this.cellBaseHost,
            cellBaseVersion: this.cellBaseVersion,
            autoRender: true,
            width: this.width - this.sidePanelWidth,
            height: 65,
            species: this.species,
            title: "Chromosome",
            collapsed: this.chromosomePanelConfig.collapsed,
            collapsible: this.chromosomePanelConfig.collapsible,
            hidden: this.chromosomePanelConfig.hidden,
            region: this.region,
            handlers: {
                "region:change": function (event) {
                    _this._regionChangeHandler(event);
                }
            }
        });

        this.on("region:change region:move", function (event) {
            chromosomePanel.setRegion(event.region);
        });
        this.on("width:change", function (event) {
            chromosomePanel.setWidth(event.width - _this.sidePanelWidth);
        });

        chromosomePanel.draw();

        return chromosomePanel;
    }

    _createOverviewTrackListPanel(target) {
        let _this = this;

        let trackListPanel = new TrackListPanel({
            cellBaseHost: this.cellBaseHost,
            cellBaseVersion: this.cellBaseVersion,
            target: target,
            autoRender: true,
            width: this.width - this.sidePanelWidth,
            zoomMultiplier: this.overviewZoomMultiplier,
            title: "Region overview",
            showRegionOverviewBox: true,
            collapsible: this.regionPanelConfig.collapsible,
            region: this.region,
            species: this.species,
            handlers: {
                "region:change": function (event) {
                    event.sender = undefined;
                    _this._regionChangeHandler(event);
                },
                "region:move": function (event) {
                    _this._regionMoveHandler(event);
                }
            }
        });

        this.on("region:change", function (event) {
            if (event.sender !== trackListPanel) {
                trackListPanel.setRegion(event.region);
            }
        });
        this.on("region:move", function (event) {
            if (event.sender !== trackListPanel) {
                trackListPanel.moveRegion(event);
            }
        });
        this.on("width:change", function (event) {
            trackListPanel.setWidth(event.width - _this.sidePanelWidth);
        });

        trackListPanel.draw();

        return trackListPanel;
    }

    _createTrackListPanel(target) {
        let _this = this;
        let trackListPanel = new TrackListPanel({
            target: target,
            cellBaseHost: this.cellBaseHost,
            cellBaseVersion: this.cellBaseVersion,
            autoRender: true,
            width: this.width - this.sidePanelWidth,
            title: this.trackListTitle,
            region: this.region,
            species: this.species,
            hidden: this.regionPanelConfig.hidden,
            handlers: {
                "region:change": function (event) {
                    event.sender = undefined;
                    _this._regionChangeHandler(event);
                },
                "region:move": function (event) {
                    _this._regionMoveHandler(event);
                }
            }
        });

        this.on("region:change", function (event) {
            if (event.sender !== trackListPanel) {
                trackListPanel.setRegion(event.region);
            }
        });
        this.on("region:move", function (event) {
            if (event.sender !== trackListPanel) {
                trackListPanel.moveRegion(event);
            }
        });
        this.on("width:change", function (event) {
            trackListPanel.setWidth(event.width - _this.sidePanelWidth);
        });

        this.on("feature:highlight", function (event) {
            trackListPanel.highlight(event);
        });

        trackListPanel.draw();

        return trackListPanel;
    }

    _createStatusBar(target) {
        let statusBar = new StatusBar({
            target: target,
            autoRender: true,
            region: this.region,
            width: this.width,
            version: this.version
        });

        this.on("region:change", function (event) {
            statusBar.setRegion(event);
        });

        this.trackListPanel.on("mousePosition:change", function (event) {
            statusBar.setMousePosition(event);
        });

        statusBar.draw();
        return statusBar;
    }


    /*****************/
    /** PRIVATE HELPER METHODS **/
    /*****************/
    _checkAndSetNewChromosomeRegion(region) {
        if (this.chromosomes.length > 0) {
            let newChr = this.chromosomes[region.chromosome];
            if (region.chromosome !== this.region.chromosome) {
                if (region.start > newChr.size || region.end > newChr.size) {
                    region.start = Math.round(newChr.size / 2);
                    region.end = Math.round(newChr.size / 2);
                }
            }
        }
    }
    _checkAndSetMinimumRegion(region, width) {
        let minLength = Math.floor(width / 10);
        if (region.length() < minLength) {
            let centerPosition = region.center();
            let aux = Math.ceil((minLength / 2) - 1);
            region.start = Math.floor(centerPosition - aux);
            region.end = Math.floor(centerPosition + aux);
        }
    }
    _calculateRegionByZoom(zoom) {
        let minNtPixels = 10; // 10 is the minimum pixels per nt
        let chr = this.chromosomes[this.region.chromosome];
        let minRegionLength = this.getSVGCanvasWidth() / minNtPixels;
        let zoomLevelMultiplier = Math.pow(chr.size / minRegionLength, 0.01); // 0.01 = 1/100  100 zoom levels
        let regionLength = minRegionLength * (Math.pow(zoomLevelMultiplier, 100 - zoom)); // invert   100 - zoom
        let centerPosition = this.region.center();
        let aux = Math.ceil((regionLength / 2) - 1);
        let start = Math.floor(centerPosition - aux);
        let end = Math.floor(centerPosition + aux);

        return {start: start, end: end};
    }
    _calculateZoomByRegion(region) {
        let minNtPixels = 10; // 10 is the minimum pixels per nt
        let minRegionLength = this.getSVGCanvasWidth() / minNtPixels;

        let zoomLevelMultiplier = 0.01;
        if (this.chromosomes !== undefined && Object.keys(this.chromosomes).length > 0) {
            let chr = this.chromosomes[region.chromosome];
            zoomLevelMultiplier = Math.pow(chr.size / minRegionLength, 0.01); // 0.01 = 1/100  100 zoom levels
        }
        let regionLength = region.length();

        let zoom = Math.log(regionLength / minRegionLength) / Math.log(zoomLevelMultiplier);
        return 100 - Math.round(zoom);
    }

    _checkChangingRegion() {
        if (typeof this.overviewTrackListPanel !== "undefined") {
            if (!this.overviewTrackListPanel.checkTracksReady()) {
                return false;
            }
        }
        if (typeof this.trackListPanel !== "undefined") {
            if (!this.trackListPanel.checkTracksReady()) {
                return false;
            }
        }
        return true;
    }

    /*****************/
    /** EVENT METHODS **/
    /*****************/
    _regionChangeHandler(event) {
        if (this._checkChangingRegion()) {

            this._checkAndSetNewChromosomeRegion(event.region);
            this._checkAndSetMinimumRegion(event.region, this.getSVGCanvasWidth());
            this.zoom = this._calculateZoomByRegion(event.region);
            //Relaunch
            this.trigger("region:change", event);
            /**/
            return true;
        } else {
            if (event.sender) {
                if (event.sender.updateRegionControls) {
                    event.sender.updateRegionControls();
                }
            }
            //console.log('****************************');
            //console.log('**************************** region change already in progress');
            //console.log('****************************');
            return false;
        }
    }
    _regionMoveHandler(event) {
        //Relaunch
        this.trigger("region:move", event);
    }
    _zoomChangeHandler(event) {
        event.zoom = Math.min(100, event.zoom);
        event.zoom = Math.max(0, event.zoom);
        this.zoom = event.zoom;
        this.region.load(this._calculateRegionByZoom(event.zoom));
        this.setRegion(this.region);
    }
    _speciesChangeHandler(event) {
        //Relaunch
        this.trigger("species:change", event);
        this._updateSpecies(event.species);

        // TODO: Change this call
        let firstGeneRegion;
        CellBaseManager.get({
            host: this.cellBaseHost,
            async: false,
            category: "feature",
            subCategory: "gene",
            resource: "first",
            species: event.species,
            params: {
                include: "chromosome,start,end"
            },
            success: function (r) {
                firstGeneRegion = r.response[0].result[0];
            }
        });

        let region = new Region(firstGeneRegion);
        this.setRegion(region);
    }

    _updateSpecies(species) {
        this.species = species;
        // this.chromosomes = this.getChromosomes();
        this.species.chromosomes = this.chromosomes;

        if (this.overviewTrackListPanel) {
            this.overviewTrackListPanel.setSpecies(species);
        }
        if (this.trackListPanel) {
            this.trackListPanel.setSpecies(species);
        }
        if (this.chromosomePanel) {
            this.chromosomePanel.setSpecies(species);
        }
        if (this.karyotypePanel) {
            this.karyotypePanel.setSpecies(species);
        }
        if (this.navigationBar) {
            this.navigationBar.setSpecies(species);
        }
    }

    _getSpeciesByTaxonomy(taxonomyCode) {
        //find species object
        let speciesObject = null;
        if (taxonomyCode !== undefined) {
            for (let i = 0; i < this.availableSpecies.items.length; i++) {
                for (let j = 0; j < this.availableSpecies.items[i].items.length; j++) {
                    let species = this.availableSpecies.items[i].items[j];
                    let taxonomy = Utils.getSpeciesCode(species.scientificName);
                    if (taxonomy === taxonomyCode) {
                        speciesObject = species;
                        break;
                    }
                }
            }
        }
        return speciesObject;
    }

    /*****************/
    /** API METHODS **/
    /*****************/

    setSpeciesByTaxonomy(taxonomyCode) {
        let species = this._getSpeciesByTaxonomy(taxonomyCode);
        if (species !== null) {
            this._speciesChangeHandler({species: species});
        } else {
            console.log("Species taxonomy not found on availableSpecies.");
        }
    }

    setRegion(region, taxonomy) {
        if (taxonomy !== undefined && taxonomy !== null) {
            let species = this._getSpeciesByTaxonomy(taxonomy);
            this._updateSpecies(species);
        }
        return this._regionChangeHandler({region: new Region(region)});
    }

    moveRegion(disp) {
        this.region.start += disp;
        this.region.end += disp;
        this.trigger("region:move", {region: this.region, disp: -disp, sender: this});
    }

    setWidth(width) {
        let newRegion = new Region(this.region);
        let newLength = width * this.region.length() / this.width;
        let centerPosition = this.region.center();
        let aux = Math.ceil((newLength / 2) - 1);
        newRegion.start = Math.floor(centerPosition - aux);
        newRegion.end = Math.floor(centerPosition + aux);

        this.width = width;

        if (this.overviewTrackListPanel) {
            this.overviewTrackListPanel.setWidth(width);
        }
        if (this.trackListPanel) {
            this.trackListPanel.setWidth(width);
        }
        if (this.chromosomePanel) {
            this.chromosomePanel.setWidth(width);
        }
        if (this.karyotypePanel) {
            this.karyotypePanel.setWidth(width);
        }
        if (this.navigationBar) {
            this.navigationBar.setWidth(width);
        }

        let hasChanged = this._regionChangeHandler({
            region: newRegion
        });
    }

    setZoom(zoom) {
        zoom = Math.min(100, zoom);
        zoom = Math.max(0, zoom);
        this.zoom = zoom;
        this.region.load(this._calculateRegionByZoom(zoom));
        this.setRegion(this.region);
    }

    increaseZoom(zoomToIncrease) {
        let zoom = this.zoom + zoomToIncrease;
        this.setZoom(zoom);
    }

    setCellBaseHost(host) {
        if (host !== this.cellBaseHost) {
            this.cellBaseHost = host;
            this.navigationBar.setCellBaseHost(this.cellBaseHost);
            this.chromosomePanel.setCellBaseHost(this.cellBaseHost);
            this.karyotypePanel.setCellBaseHost(this.cellBaseHost);
            this.trackListPanel.setCellBaseHost(this.cellBaseHost);
            this.overviewTrackListPanel.setCellBaseHost(this.cellBaseHost);

            this._updateSpecies(this.species);
            this.setRegion(new Region(this.region));
        }
    }

    /*****************/
    getSVGCanvasWidth() {
        return this.width - this.trackPanelScrollWidth - this.sidePanelWidth;
    }
    /*****************/

    mark(args) {
        let attrName = args.attrName || "feature_id";
        let cssClass = args.class || "ocb-feature-mark";
        if ("attrValues" in args) {
            args.attrValues = ($.isArray(args.attrValues)) ? args.attrValues : [args.attrValues];
            for (let key in args.attrValues) {
                $(`rect[${attrName} ~= ${args.attrValues[key]}]`).attr("class", cssClass);
            }

        }
    }

    unmark(args) {
        let attrName = args.attrName || "feature_id";
        if ("attrValues" in args) {
            args.attrValues = ($.isArray(args.attrValues)) ? args.attrValues : [args.attrValues];
            for (let key in args.attrValues) {
                $(`rect[${attrName} ~= ${args.attrValues[key]}]`).attr("class", "");
            }
        }
    }

    highlight(args) {
        this.trigger("feature:highlight", args);
    }

    getRightSidePanelId() {
        return $(this.rightSidebarDiv).attr("id");
    }

    getLeftSidePanelId() {
        return $(this.leftSidebarDiv).attr("id");
    }

    getNavigationPanelId() {
        return $(this.navigationbarDiv).attr("id");
    }

    getStatusPanelId() {
        return $(this.statusbarDiv).attr("id");
    }

    setNavigationBar(navigationBar) {
        this.navigationBar = navigationBar;
        let config = {
            availableSpecies: this.availableSpecies,
            species: this.species,
            region: this.region,
            width: this.width,
            svgCanvasWidthOffset: this.trackPanelScrollWidth + this.sidePanelWidth
        };
        _.extend(this.navigationBar, config);
        navigationBar.render(this.getNavigationPanelId());
    }

    toggleAutoHeight(bool) {
        this.trackListPanel.toggleAutoHeight(bool);
        this.overviewTrackListPanel.toggleAutoHeight(bool);
    }

    updateHeight() {
        this.trackListPanel.updateHeight();
        this.overviewTrackListPanel.updateHeight();
    }

    setSpeciesVisible(bool) {
        this.navigationBar.setSpeciesVisible(bool);
    }

    setChromosomesVisible(bool) {
        this.navigationBar.setChromosomeMenuVisible(bool);
    }

    setKaryotypePanelVisible(bool) {
        this.karyotypePanel.setVisible(bool);
        this.navigationBar.setVisible({"karyotype": bool});
    }

    setChromosomePanelVisible(bool) {
        this.chromosomePanel.setVisible(bool);
        this.navigationBar.setVisible({"chromosome": bool});
    }

    setRegionOverviewPanelVisible(bool) {
        this.overviewTrackListPanel.setVisible(bool);
        this.navigationBar.setVisible({"region": bool});
    }

    setRegionTextBoxVisible(bool) {
        this.navigationBar.setRegionTextBoxVisible(bool);
    }
    setSearchVisible(bool) {
        this.navigationBar.setSearchVisible(bool);
    }
    setFullScreenVisible(bool) {
        this.navigationBar.setFullScreenButtonVisible(bool);
    }

    /*Track management*/
    addOverviewTrack(track) {
        this.overviewTrackListPanel.addTrack(track);
    }

    addTrack(track) {
        this.trackListPanel.addTrack(track);
    }

    getTrackById(trackId) {
        return this.trackListPanel.getTrackById(trackId);
    }

    removeTrack(track) {
        return this.trackListPanel.removeTrack(track);
    }

    restoreTrack(track, index) {
        return this.trackListPanel.restoreTrack(track, index);
    }

    setTrackIndex(track, newIndex) {
        return this.trackListPanel.setTrackIndex(track, newIndex);
    }

    scrollToTrack(track) {
        return this.trackListPanel.scrollToTrack(track);
    }

    showTrack(track) {
        this.trackListPanel.showTrack(track);
    }

    hideTrack(track) {
        this.trackListPanel.hideTrack(track);
    }
    containsTrack(track) {
        return this.trackListPanel.containsTrack(track);
    }
    containsTrackById(trackId) {
        return this.getTrackById(trackId) !== null;
    }
    deleteTracksCache(){
        this.overviewTrackListPanel.deleteTracksCache();
        this.trackListPanel.deleteTracksCache();
    }

    // TODO - DEPRECATED
    checkRenderedTrack(trackId) {
        console.log("DEPRECATED METHOD");
        console.log(this.checkRenderedTrack);
        this.trackExists(trackId);
    }
}
/**
 * Created by agaor on 14/08/17.
 */
class KaryotypePanel {

    constructor(args) {
        Object.assign(this, Backbone.Events);

        this.target;
        this.autoRender = true;
        this.id = Utils.genId('KaryotypePanel');

        this.client;

        this.pixelBase = 0;
        this.species;
        this.width = 600;
        this.height = 75;
        this.collapsed = false;
        this.collapsible = true;
        this.hidden = false;

        //set instantiation args, must be last
        Object.assign(this, args);

        //set own region object
        this.region = new Region(this.region);

        this.lastSpecies = this.species;

        this.chromosomeList = [];
        this.data2;

        this.on(this.handlers);

        this.regionChanging = false;

        this.rendered = false;
        if (this.autoRender) {
            this.render();
        }
    }

    show() {
        $(this.div).css({display: 'block'});
        this.hidden = false;
    }

    hide() {
        $(this.div).css({display: 'none'});
        this.hidden = true;
    }

    setVisible(bool) {
        if (bool) {
            this.show()
        } else {
            this.hide()
        }
    }

    showContent() {
        $(this.svg).css({display: 'inline'});
        this.collapsed = false;
        $(this.collapseDiv).removeClass('active');
        $(this.collapseDiv).children().first().removeClass('fa-plus');
        $(this.collapseDiv).children().first().addClass('fa-minus');
    }

    hideContent() {
        $(this.svg).css({display: 'none'});
        this.collapsed = true;
        $(this.collapseDiv).addClass('active');
        $(this.collapseDiv).children().first().removeClass('fa-minus');
        $(this.collapseDiv).children().first().addClass('fa-plus');
    }

    setTitle(title) {
        if ('titleDiv' in this) {
            $(this.titleTextDiv).html(title);
        }
    }

    setWidth(width) {
        this.width = width;
        this.svg.setAttribute("width", width);


        if (typeof this.chromosomeList !== 'undefined') {
            this.clean();
            this._drawSvg(this.chromosomeList, this.data2);
        }
    }

    render() {
        let _this = this;

        this.div = $('<div id="karyotype-panel"></div>')[0];

        if ('title' in this && this.title !== '') {

            let titleDiv = $('<div id="tl-title" class="ocb-gv-panel-title unselectable"></div>')[0];
            $(this.div).append(titleDiv);

            if (this.collapsible == true) {
                this.collapseDiv = $('<div class="ocb-gv-panel-collapse-control"><span class="fa fa-minus"></span></div>');
                $(titleDiv).dblclick(function () {
                    if (_this.collapsed) {
                        _this.showContent();
                    } else {
                        _this.hideContent();
                    }
                });
                $(this.collapseDiv).click(function () {
                    if (_this.collapsed) {
                        _this.showContent();
                    } else {
                        _this.hideContent();
                    }
                });
                $(titleDiv).append(this.collapseDiv);
            }

            this.titleTextDiv = $('<div class="ocb-gv-panel-text">' + this.title + '</div>');
            $(titleDiv).append(this.titleTextDiv);
        }

        this.svg = SVG.init(this.div, {
            "width": this.width,
            "height": this.height
        });
        this.markGroup = SVG.addChild(this.svg, "g", {"cursor": "pointer"});
        $(this.div).addClass('unselectable');

        this.colors = {gneg: "white", stalk: "#666666", gvar: "#CCCCCC", gpos25: "silver", gpos33: "lightgrey", gpos50: "gray", gpos66: "dimgray", gpos75: "darkgray", gpos100: "black", gpos: "gray", acen: "blue"};


        this.setVisible(!this.hidden);

        this.rendered = true;
    }

    setSpecies (species) {
        this.lastSpecies = this.species;
        this.species = species;
    }

    clean() {
        $(this.svg).empty();
    }

    draw () {
        let _this = this;
        this.targetDiv = ( this.target instanceof HTMLElement ) ? this.target : document.querySelector('#' + this.target);
        if (!this.targetDiv) {
            console.log('target not found');
            return;
        }
        this.targetDiv.appendChild(this.div);

        this.clean();

        let sortfunction = function (a, b) {
            let IsNumber = true;
            for (let i = 0; i < a.name.length && IsNumber == true; i++) {
                if (isNaN(a.name[i])) {
                    IsNumber = false;
                }
            }
            if (!IsNumber) return 1;
            return (a.name - b.name);
        };

        this.client.get("genomic", "chromosome", undefined, "search")
            .then(function (data) {
                _this.chromosomeList = UtilsNew.removeDuplicates(data.response[0].result[0].chromosomes,"name");
                _this.chromosomeList.sort(sortfunction);
                _this._drawSvg(_this.chromosomeList);
            });

        if (this.collapsed) {
            _this.hideContent();
        }
    }

    _drawSvg(chromosomeList) {
        let _this = this;

        let x = 20;
        let xOffset = _this.width / chromosomeList.length;
        let yMargin = 2;

        ///////////
        let biggerChr = 0;
        for (let i = 0, len = chromosomeList.length; i < len; i++) {
            let size = chromosomeList[i].size;
            if (size > biggerChr) {
                biggerChr = size;
            }
        }

        _this.pixelBase = (_this.height - 10) / biggerChr;
        _this.chrOffsetY = {};
        _this.chrOffsetX = {};

        for (let i = 0, len = chromosomeList.length; i < len; i++) { //loop over chromosomes
            let chromosome = chromosomeList[i];

            let chrSize = chromosome.size * _this.pixelBase;
            let y = yMargin + (biggerChr * _this.pixelBase) - chrSize;
            _this.chrOffsetY[chromosome.name] = y;
            let firstCentromere = true;


            let group = SVG.addChild(_this.svg, "g", {"cursor": "pointer", "chr": chromosome.name});
            $(group).click(function (event) {
                let chrClicked = this.getAttribute("chr");
                //			for ( var k=0, len=chromosomeList.length; k<len; k++) {
                //			var offsetX = (event.pageX - $(_this.svg).offset().left);
                //			if(offsetX > _this.chrOffsetX[chromosomeList[k]]) chrClicked = chromosomeList[k];
                //			}

                let offsetY = (event.pageY - $(_this.svg).offset().top);
                //			var offsetY = event.originalEvent.layerY - 3;

                let clickPosition = parseInt((offsetY - _this.chrOffsetY[chrClicked]) / _this.pixelBase);
                let region = new Region({
                    chromosome: chrClicked,
                    start: clickPosition,
                    end: clickPosition
                });
                _this._triggerRegionChange({region: region, sender: _this});
            });

            for (let j = 0, lenJ = chromosome.cytobands.length; j < lenJ; j++) { //loop over chromosome objects
                let cytoband = chromosome.cytobands[j];
                let height = _this.pixelBase * (cytoband.end - cytoband.start);
                let width = 13;

                let color = _this.colors[cytoband.stain];
                if (color == null) color = "purple";

                if (cytoband.stain == "acen") {
                    let points = "";
                    let middleX = x + width / 2;
                    let middleY = y + height / 2;
                    let endX = x + width;
                    let endY = y + height;
                    if (firstCentromere) {
                        points = x + "," + y + " " + endX + "," + y + " " + endX + "," + middleY + " " + middleX + "," + endY + " " + x + "," + middleY;
                        firstCentromere = false;
                    } else {
                        points = x + "," + endY + " " + x + "," + middleY + " " + middleX + "," + y + " " + endX + "," + middleY + " " + endX + "," + endY;
                    }
                    SVG.addChild(group, "polyline", {
                        "points": points,
                        "stroke": "black",
                        "opacity": 0.8,
                        "fill": color
                    });
                } else {
                    SVG.addChild(group, "rect", {
                        "x": x,
                        "y": y,
                        "width": width,
                        "height": height,
                        "stroke": "grey",
                        "opacity": 0.8,
                        "fill": color
                    });
                }

                y += height;
            }
            let text = SVG.addChild(_this.svg, "text", {
                "x": x + 1,
                "y": _this.height,
                "font-size": 9,
                "fill": "black"
            });
            text.textContent = chromosome.name;

            _this.chrOffsetX[chromosome.name] = x;
            x += xOffset;
        }


        this.positionBox = SVG.addChild(this.svg, "line", {
            "x1": 0,
            "y1": 0,
            "x2": 0,
            "y2": 0,
            "stroke": "orangered",
            "stroke-width": 2,
            "opacity": 0.5
        });
        this._recalculatePositionBox(this.region);


        this.rendered = true;
        this.trigger('after:render', {sender: this});
    }

    _triggerRegionChange(event) {
        let _this = this;
        if (!this.regionChanging) {
            this.regionChanging = true;
            /**/
            this.trigger('region:change', event);
            /**/
            setTimeout(function () {
                _this.regionChanging = false;
            }, 700);
        } else {
            this.updateRegionControls();
        }
    }

    _recalculatePositionBox(region) {
        let centerPosition = region.center();
        let pointerPosition = centerPosition * this.pixelBase + this.chrOffsetY[region.chromosome];
        this.positionBox.setAttribute("x1", this.chrOffsetX[region.chromosome] - 10);
        this.positionBox.setAttribute("x2", this.chrOffsetX[region.chromosome] + 23);
        this.positionBox.setAttribute("y1", pointerPosition);
        this.positionBox.setAttribute("y2", pointerPosition);
    }

    updateRegionControls () {
        this._recalculatePositionBox(this.region);
    }

    setRegion (region) {//item.chromosome, item.position, item.species
        this.region.load(region);
        let needDraw = false;

        if (this.lastSpecies != this.species) {
            needDraw = true;
            this.lastSpecies = this.species;
        }
        if (needDraw) {
            this.draw();
        }

        this.updateRegionControls();
    }


//    updatePositionBox: function () {
//        this.positionBox.setAttribute("x1", this.chrOffsetX[this.region.chromosome] - 10);
//        this.positionBox.setAttribute("x2", this.chrOffsetX[this.region.chromosome] + 23);
//
//        var centerPosition = Utils.centerPosition(this.region);
//        var pointerPosition = centerPosition * this.pixelBase + this.chrOffsetY[this.region.chromosome];
//        this.positionBox.setAttribute("y1", pointerPosition);
//        this.positionBox.setAttribute("y2", pointerPosition);
//    },

    addMark (item) {//item.chromosome, item.position
        let _this = this;

        let mark = function () {
            if (_this.region.chromosome != null && _this.region.start != null) {
                if (_this.chrOffsetX[_this.region.chromosome] != null) {
                    let x1 = _this.chrOffsetX[_this.region.chromosome] - 10;
                    let x2 = _this.chrOffsetX[_this.region.chromosome];
                    let y1 = (_this.region.start * _this.pixelBase + _this.chrOffsetY[_this.region.chromosome]) - 4;
                    let y2 = _this.region.start * _this.pixelBase + _this.chrOffsetY[_this.region.chromosome];
                    let y3 = (_this.region.start * _this.pixelBase + _this.chrOffsetY[_this.region.chromosome]) + 4;
                    let points = x1 + "," + y1 + " " + x2 + "," + y2 + " " + x1 + "," + y3 + " " + x1 + "," + y1;
                    SVG.addChild(_this.markGroup, "polyline", {
                        "points": points,
                        "stroke": "black",
                        "opacity": 0.8,
                        "fill": "#33FF33"
                    });
                }
            }
        };

        if (this.rendered) {
            mark();
        } else {
            _this.on('after:render', function (e) {
                mark();
            });
        }
    }

    unmark () {
        $(this.markGroup).empty();
    }

    setCellBaseHost (host) {
        this.cellBaseHost = host;
    }

}

class NavigationBar {

    constructor(args) {
        Object.assign(this, Backbone.Events);

        this.id = Utils.genId("NavigationBar");

        this.target;
        this.autoRender = true;

        this.cellBaseHost = 'http://bioinfo.hpc.cam.ac.uk/cellbase';
        this.cellBaseVersion = 'v3';

        this.species = 'Homo sapiens';
        this.increment = 3;
        this.componentsConfig = {
            menuButton: false,
            leftSideButton: false,
            restoreDefaultRegionButton: true,
            regionHistoryButton: true,
            speciesButton: true,
            chromosomesButton: true,
            karyotypeButtonLabel: true,
            chromosomeButtonLabel: true,
            regionButtonLabel: true,
            zoomControl: true,
            windowSizeControl: true,
            positionControl: true,
            moveControl: true,
            autoheightButton: true,
            compactButton: true,
            searchControl: true
        };
        this.zoom = 50;

        this.quickSearchDisplayKey = 'name';


        Object.assign(this.componentsConfig, args.componentsConfig);
        delete args.componentsConfig;

        //set instantiation args, must be last
        Object.assign(this, args);


        //set new region object
        this.region = new Region(this.region);

        this.currentChromosomeList = [];

        this.on(this.handlers);


        this.els = {};
        this.zoomChanging = false;
        this.regionChanging = false;

        this.rendered = false;
        if (this.autoRender) {
            this.render();
        }
    }


    render() {
        let _this = this;


        let HTML = '' +
            '<div title="Restore previous region" style="margin-right: 5px;" id="leftSideButton" class="ocb-ctrl"><i class="fa fa-navicon"></i></div>' +
            '<div id="restoreDefaultRegionButton" class="ocb-ctrl"><i class="fa fa-repeat"></i></div>' +

            '<div title="Region history" class="ocb-dropdown" style="margin-left: 5px">' +
            '   <div tabindex="-1" id="regionHistoryButton" class="ocb-ctrl"><i class="fa fa-history"></i> <i class="fa fa-caret-down"></i></div>' +
            '   <ul id="regionHistoryMenu"></ul>' +
            '</div>' +

            '<div title="Species menu" class="ocb-dropdown" style="margin-left: 5px">' +
            '   <div tabindex="-1" id="speciesButton" class="ocb-ctrl"><span id="speciesText"></span> <i class="fa fa-caret-down"></i></div>' +
            '   <ul id="speciesMenu"></ul>' +
            '</div>' +

            '<div title="Chromosomes menu" class="ocb-dropdown" style="margin-left: 5px">' +
            '   <div tabindex="-1" id="chromosomesButton" class="ocb-ctrl"><span id="chromosomesText"></span> <i class="fa fa-caret-down"></i></div>' +
            '   <ul id="chromosomesMenu" style="height: 200px; overflow-y: auto;"></ul>' +
            '</div>' +

            '<div style="margin-left: 5px; float: left; " >' +
            '   <label title="Toggle karyotype panel" class="ocb-ctrl" id="karyotypeButtonLabel"><input id="karyotypeButton" type="checkbox"><span style="border-right: none"><span class="ocb-icon ocb-icon-karyotype"></span></span></label>' +
            '   <label title="Toggle chromosome panel" class="ocb-ctrl" id="chromosomeButtonLabel"><input id="chromosomeButton" type="checkbox"><span style="border-right: none"><span class="ocb-icon ocb-icon-chromosome"></span></span></label>' +
            '   <label title="Toggle overview panel" class="ocb-ctrl" id="regionButtonLabel"><input id="regionButton" type="checkbox"><span><span class="ocb-icon ocb-icon-region"></span></span></label>' +
            '</div>' +


            '<div id="zoomControl" style="float:left;">' +
            '<div title="Minimum window size" id="zoomMinButton" class="ocb-ctrl" style="margin-left: 5px;border-right: none;">Min</div>' +
            '<div title="Decrease window size" id="zoomOutButton" class="ocb-ctrl"><span class="fa fa-minus"></span></div>' +
            '<div id="progressBarCont" class="ocb-zoom-bar">' +
            '   <div id="progressBar" class="back"></div>' +
            '   <div id="progressBar" class="rect" style="width: ' + this.zoom + '%"></div>' +
            '   <div id="progressBarBall" class="ball" style="left: ' + this.zoom + '%"></div>' +
            '</div>' +
            '<div title="Increase window size" id="zoomInButton" class="ocb-ctrl" style="border-right: none;"><span class="fa fa-plus"></span></div>' +
            '<div title="Maximum window size" id="zoomMaxButton" class="ocb-ctrl">Max</div>' +
            '</div>' +


            '<div title="Window size (Nucleotides)" id="windowSizeControl" style="float:left;margin-left: 5px;">' +
            '<input id="windowSizeField" class="ocb-ctrl"  type="text" style="width: 70px;">' +
            '</div>' +


            '<div title="Position" id="positionControl" style="float:left;margin-left: 5px">' +
            '<input id="regionField" class="ocb-ctrl" placeholder="1:10000-20000" type="text" style="width: 170px;">' +
            '<div id="goButton" class="ocb-ctrl" style="border-left: none;">Go!</div>' +
            '</div>' +


            '<div id="moveControl" style="float:left;font-size:18px;">' +
            '<div id="moveFurtherLeftButton" class="ocb-ctrl" style="border-right: none;margin-left: 5px;"><i class="fa fa-angle-double-left"></i></div>' +
            '<div id="moveLeftButton" class="ocb-ctrl" style="border-right: none;"><i class="fa fa-angle-left"></i></div>' +
            '<div id="moveRightButton" class="ocb-ctrl" style="border-right: none;"><i class="fa fa-angle-right"></i></div>' +
            '<div id="moveFurtherRightButton" class="ocb-ctrl"><i class="fa fa-angle-double-right"></i></div>' +
            '</div>' +

            '<label class="ocb-ctrl"><input type="checkbox" id="autoheightButton"><span style="margin-left: 5px;font-size:18px;"><i class="fa fa-compress"></i></span></label>' +

            '<div id="searchControl" style="float:left;">' +
            '<input id="searchField" class="ocb-ctrl"  list="searchDataList"  placeholder="gene" type="text" style="width: 90px;margin-left: 5px;">' +
            '       <datalist id="searchDataList">' +
            '       </datalist>' +
            '<div id="quickSearchButton" class="ocb-ctrl" style="border-left: none;"><i class="fa fa-search"></i></div>' +
            '</div>' +


            '<div style="float:right;margin-right:10px;" id="menuButton" class="ocb-ctrl"><i class="fa fa-navicon"></i> Configure</div>' +
            '';

        /**************/
        this.div = document.createElement('div');
        this.div.setAttribute('class', "ocb-gv-navigation-bar unselectable");
        this.div.innerHTML = HTML;

        let els = this.div.querySelectorAll('[id]');
        for (let i = 0; i < els.length; i++) {
            let elid = els[i].getAttribute('id');
            if (elid) {
                this.els[elid] = els[i];
            }
        }
        /**************/


        /**Check components config**/
        for (let key in this.componentsConfig) {
            if (!this.componentsConfig[key]) {
                this.els[key].classList.add('hidden');
            }
        }
        /*****/

        this.els.karyotypeButton.checked = (this.karyotypePanelConfig.hidden) ? false : true;
        this.els.chromosomeButton.checked = (this.chromosomePanelConfig.hidden) ? false : true;
        this.els.regionButton.checked = (this.regionPanelConfig.hidden) ? false : true;


        /*** ***/

        this.els.menuButton.addEventListener('click', function(e) {
            _this.trigger('menuButton:click', {clickEvent: e, sender: {}});
        });

        this.els.leftSideButton.addEventListener('click', function(e) {
            _this.trigger('leftSideButton:click', {clickEvent: e, sender: {}});
        });

        this.els.restoreDefaultRegionButton.addEventListener('click', function(e) {
            _this.trigger('restoreDefaultRegion:click', {clickEvent: e, sender: {}});
        });


        this._addRegionHistoryMenuItem(this.region);
        this._setChromosomeMenu();
        this._setSpeciesMenu();
        this.els.chromosomesText.textContent = this.region.chromosome;
        this.els.speciesText.textContent = this.species.scientificName;


        this.els.karyotypeButton.addEventListener('click', function() {
            _this.trigger('karyotype-button:change', {selected: this.checked, sender: _this});
        });
        this.els.chromosomeButton.addEventListener('click', function() {
            _this.trigger('chromosome-button:change', {selected: this.checked, sender: _this});
        });
        this.els.regionButton.addEventListener('click', function() {
            _this.trigger('region-button:change', {selected: this.checked, sender: _this});
        });


        this.els.zoomOutButton.addEventListener('click', function() {
            _this._handleZoomOutButton();
        });
        this.els.zoomInButton.addEventListener('click', function() {
            _this._handleZoomInButton();
        });
        this.els.zoomMaxButton.addEventListener('click', function() {
            _this._handleZoomSlider(100);
        });
        this.els.zoomMinButton.addEventListener('click', function() {
            _this._handleZoomSlider(0);
        });


        let zoomBarMove = function(e) {
            let progressBarCont = _this.els.progressBarCont;
            let br = progressBarCont.getBoundingClientRect();
            let offsetX = e.clientX - br.left;
            let zoom = 100 / parseInt(getComputedStyle(progressBarCont).width) * offsetX;
            if (zoom > 0 && zoom < 100) {
                _this.els.progressBarBall.style.left = zoom + '%';
            }
        };
        this.els.progressBarCont.addEventListener('click', function(e) {
            let br = this.getBoundingClientRect();
            let offsetX = e.clientX - br.left;
            let zoom = 100 / parseInt(getComputedStyle(this).width) * offsetX;
            _this._handleZoomSlider(zoom);

            this.removeEventListener('mousemove', zoomBarMove);
        });
        this.els.progressBarBall.addEventListener('mousedown', function(e) {
            _this.els.progressBarCont.addEventListener('mousemove', zoomBarMove);
        });
        this.els.progressBarBall.addEventListener('mouseleave', function(e) {
            _this.els.progressBarCont.removeEventListener('mousemove', zoomBarMove);
            _this.els.progressBarBall.style.left = _this.zoom + '%';
        });

        this.els.regionField.value = this.region.toString();
        this.els.regionField.addEventListener('keyup', function(event) {
            if (_this._checkRegion(this.value) && event.which === 13) {
                _this._triggerRegionChange({region: new Region(this.value), sender: this});
            }
        });
        this.els.goButton.addEventListener('click', function() {
            let value = _this.els.regionField.value;
            if (_this._checkRegion(value)) {
                _this._triggerRegionChange({region: new Region(value), sender: this});
            }
        });

        this.els.moveFurtherLeftButton.addEventListener('click', function() {
            _this._handleMoveRegion(10);
        });

        this.els.moveFurtherRightButton.addEventListener('click', function() {
            _this._handleMoveRegion(-10);
        });

        this.els.moveLeftButton.addEventListener('click', function() {
            _this._handleMoveRegion(1);
        });

        this.els.moveRightButton.addEventListener('click', function() {
            _this._handleMoveRegion(-1);
        });

        this.els.autoheightButton.addEventListener('click', function() {
            _this.trigger('autoHeight-button:change', {selected: this.checked, sender: _this});
        });

        let lastQuery = '';
        this.els.searchField.addEventListener('keyup', function(event) {
            this.classList.remove('error');
            let query = this.value;
            if (query.length > 2 && lastQuery !== query && event.which !== 13) {
                _this._setQuickSearchMenu(query);
                lastQuery = query;
            }
            if (event.which === 13) {
                let item = _this.quickSearchDataset[query];
                if (item) {
                    _this.trigger('quickSearch:select', {item: item, sender: _this});
                } else {
                    this.classList.add('error');
                }
            }
        });

        this.els.quickSearchButton.addEventListener('click', function() {
            _this.els.searchField.classList.remove('error');
            let query = _this.els.searchField.value;
            let item = _this.quickSearchDataset[query];
            if (item) {
                _this.trigger('quickSearch:go', {item: item, sender: _this});
            } else {
                _this.els.searchField.classList.add('error');
            }
        });

        this.els.windowSizeField.value = this.region.length();
        this.els.windowSizeField.addEventListener('keyup', function(event) {
            let value = this.value;
            let pattern = /^([0-9])+$/;
            if (pattern.test(value)) {
                this.classList.remove('error');
                if (event.which === 13) {
                    let regionSize = parseInt(value);
                    let haflRegionSize = Math.floor(regionSize / 2);
                    let region = new Region({
                        chromosome: _this.region.chromosome,
                        start: _this.region.center() - haflRegionSize,
                        end: _this.region.center() + haflRegionSize
                    });
                    _this._triggerRegionChange({region: region, sender: _this});
                }
            } else {
                this.classList.add('error');
            }
        });
        this.rendered = true;
    }

    draw() {
        this.targetDiv = (this.target instanceof HTMLElement ) ? this.target : document.querySelector('#' + this.target);
        if (!this.targetDiv) {
            console.log('target not found');
            return;
        }
        this.targetDiv.appendChild(this.div);
    }

    _addRegionHistoryMenuItem(region) {
        let _this = this;
        let menuEntry = document.createElement('li');
        menuEntry.textContent = region.toString();
        this.els.regionHistoryMenu.appendChild(menuEntry);
        menuEntry.addEventListener('click', function() {
            _this._triggerRegionChange({region: new Region(this.textContent), sender: _this});
        });
    }

    _setQuickSearchMenu(query) {
        if (typeof this.quickSearchResultFn === 'function') {
            while (this.els.searchDataList.firstChild) {
                this.els.searchDataList.removeChild(this.els.searchDataList.firstChild);
            }
            this.quickSearchDataset = {};
            let _this = this;
            this.quickSearchResultFn(query)
                .then(function(data) {
                    let items = data.response[0].result;
                    for (let i = 0; i < items.length; i++) {
                        let item = items[i];
                        let value = item.name;
                        _this.quickSearchDataset[value] = item;
                        let menuEntry = document.createElement('option');
                        menuEntry.setAttribute('value', value);
                        _this.els.searchDataList.appendChild(menuEntry);
                    }
                });

        } else {
            console.log('the quickSearchResultFn function is not valid');
        }
    }

    _setChromosomeMenu() {
        let _this = this;

        while (this.els.chromosomesMenu.firstChild) {
            this.els.chromosomesMenu.removeChild(this.els.chromosomesMenu.firstChild);
        }

        let list = [];
        for (let chr in this.species.chromosomes) {
            list.push(chr);

            let menuEntry = document.createElement('li');
            menuEntry.textContent = chr;
            this.els.chromosomesMenu.appendChild(menuEntry);

            menuEntry.addEventListener('click', function() {
                let region = new Region({
                    chromosome: this.textContent,
                    start: _this.region.start,
                    end: _this.region.end
                });
                _this._triggerRegionChange({region: region, sender: _this});
            });

        }
        this.currentChromosomeList = list;
    }

    _setSpeciesMenu() {
        let _this = this;

        let createSpeciesEntry = function(species, ul) {
            let menuEntry = document.createElement('li');
            menuEntry.textContent = species.scientificName + ' (' + species.assembly.name + ')';
            ul.appendChild(menuEntry);

            menuEntry.addEventListener('click', function() {
                _this.trigger('species:change', {species: species, sender: _this});
            });
        };

        let createTaxonomy = function(taxonomy) {
            let menuEntry = document.createElement('li');
            menuEntry.setAttribute('data-sub', true);
            menuEntry.textContent = taxonomy;
            _this.els.speciesMenu.appendChild(menuEntry);

            let ul = document.createElement('ul');
            menuEntry.appendChild(ul);

            return ul;
        };

        //find species object
        for (let taxonomy in this.availableSpecies) {
            let taxUl = createTaxonomy(taxonomy);
            for (let i = 0; i < this.availableSpecies[taxonomy].length; i++) {
                let species = this.availableSpecies[taxonomy][i];
                createSpeciesEntry(species, taxUl);
            }
        }
    }

    _checkRegion(value) {
        let reg = new Region(value);
        if (!reg.parse(value) || reg.start < 0 || reg.end < 0 || _.indexOf(this.currentChromosomeList, reg.chromosome) == -1) {
            this.els.regionField.classList.add('error');
            return false;
        } else {
            this.els.regionField.classList.remove('error');
            return true;
        }
    }

    _handleZoomOutButton() {
        this._handleZoomSlider(Math.max(0, this.zoom - 5));
    }

    _handleZoomSlider(value) {
        let _this = this;
        if (!_this.zoomChanging) {
            _this.zoomChanging = true;
            /**/
            _this.zoom = 5 * (Math.round(value / 5));
            _this.trigger('zoom:change', {zoom: _this.zoom, sender: _this});
            /**/
            setTimeout(function() {
                _this.zoomChanging = false;
            }, 700);
        }
    }

    _handleZoomInButton() {
        this._handleZoomSlider(Math.min(100, this.zoom + 5));
    }

    _handleMoveRegion(positions) {
        let pixelBase = (this.width - this.svgCanvasWidthOffset) / this.region.length();
        let disp = Math.round((positions * 10) / pixelBase);
        this.region.start -= disp;
        this.region.end -= disp;
        this.els.regionField.value = this.region.toString();
        this.trigger('region:move', {region: this.region, disp: disp, sender: this});
    }

    setVisible(obj) {
        for (let key in obj) {
            let el = this.els[key];
            if (obj[key]) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        }
    }

    setRegion(region, zoom) {
        this.region.load(region);
        if (zoom) {
            this.zoom = 5 * (Math.round(zoom / 5));
        }
        this.updateRegionControls();
        this._addRegionHistoryMenuItem(region);
    }

    moveRegion(region) {
        this.region.load(region);
        this.els.chromosomesText.textContent = this.region.chromosome;
        this.els.regionField.value = this.region.toString()
    }

    setSpecies(species) {
        this.species = species;
        this.els.speciesText.textContent = this.species.scientificName;
        this._setChromosomeMenu();
    }

    setWidth(width) {
        this.width = width;
    }

    _triggerRegionChange(event) {
        let _this = this;
        if (!this.regionChanging) {
            this.regionChanging = true;
            /**/
            this.trigger('region:change', event);
            /**/
            setTimeout(function() {
                _this.regionChanging = false;
            }, 700);
        } else {
            this.updateRegionControls();
        }
    }

    updateRegionControls() {
        this.els.chromosomesText.textContent = this.region.chromosome;
        this.els.regionField.value = this.region.toString();
        this.els.windowSizeField.value = this.region.length();
        this.els.regionField.classList.remove('error');
        this.els.progressBar.style.width = this.zoom + '%';
        this.els.progressBarBall.style.left = this.zoom + '%';
    }

    setCellBaseHost(host) {
        this.cellBaseHost = host;
    }

}
class StatusBar {

    constructor(args) {
        Object.assign(this, Backbone.Events);

        this.id = Utils.genId("StatusBar");

        this.target;
        this.autoRender = true;

        //set instantiation args, must be last
        Object.assign(this, args);

        //set new region object
        this.region = new Region(this.region);

        this.rendered = false;
        if (this.autoRender) {
            this.render();
        }
    }

    render() {

        this.div = $('<div id="' + this.id + '" class="ocb-gv-status-bar"></div>')[0];

        this.rightDiv = $('<div class="ocb-gv-status-right" id="' + this.id + 'position"</div>')[0];
        this.leftDiv = $('<div class="ocb-gv-status-left" id="' + this.id + 'position"></div>')[0];
        $(this.div).append(this.leftDiv);
        $(this.div).append(this.rightDiv);

        this.mousePositionEl = $('<span id="' + this.id + 'position"></span>')[0];
        this.mousePositionBase = document.createElement('span');
        this.mousePositionBase.style.marginRight = '5px';
        this.mousePositionRegion = document.createElement('span');
        this.mousePositionEl.appendChild(this.mousePositionBase);
        this.mousePositionEl.appendChild(this.mousePositionRegion);

        this.versionEl = $('<span id="' + this.id + 'version">' + this.version + '</span>')[0];
        $(this.rightDiv).append(this.mousePositionEl);
        $(this.leftDiv).append(this.versionEl);

        this.rendered = true;
    }

    draw () {
        this.targetDiv = (this.target instanceof HTMLElement) ? this.target : document.querySelector('#' + this.target);
        if (!this.targetDiv) {
            console.log('target not found');
            return;
        }
        this.targetDiv.appendChild(this.div);
    }

    setRegion (event) {
        this.region.load(event.region);
        this.mousePositionBase.textContent = "";
        this.mousePositionRegion.textContent = this.region.chromosome + ':' + Utils.formatNumber(event.region.center());
    }

    setMousePosition (event) {
        this.mousePositionBase.style.color = SEQUENCE_COLORS[event.base];
        this.mousePositionBase.textContent = event.base;

        this.mousePositionRegion.textContent = this.region.chromosome + ':' + Utils.formatNumber(event.mousePos);
    }

}
//Parent class for all renderers
class Renderer {

    constructor(args) {
        this.fontClass = "ocb-font-roboto ocb-font-size-11";
        this.toolTipfontClass = "ocb-tooltip-font";
    }

    init() {

    }

    render(items) {
    }

    getFeatureX(start, args) {    // returns svg feature x value from feature genomic position
        let middle = args.width / 2;
        let x = args.pixelPosition + middle - ((args.position - start) * args.pixelBase);
        return x;
    }

    getDefaultConfig(type) {
        return FEATURE_TYPES[type];
    }

    getLabelWidth(label, args) {
        /* insert in dom to get the label width and then remove it*/
        let svgLabel = SVG.create("text", {
            "font-weight": 400,
            "class":this.fontClass
        });
        svgLabel.textContent = label;
        $(args.svgCanvasFeatures).append(svgLabel);
        let svgLabelWidth = $(svgLabel).width();
        $(svgLabel).remove();
        return svgLabelWidth;
    }
}
class AlignmentRenderer extends Renderer {

    constructor(args) {
        super(args);
        // Extend and add Backbone Events
        Object.assign(this, Backbone.Events);

        this.fontClass = "ocb-font-roboto ocb-font-size-11";
        this.toolTipfontClass = "ocb-tooltip-font";

        if (_.isObject(args)) {
            Object.assign(this, args);
        }
        Object.assign(this, this.getDefaultConfig(), this.config);

        this.on(this.handlers);
    }

    render(response, args) {
        if (UtilsNew.isUndefined(response.params)) {
            response.params = {};
        }

        // CHECK VISUALIZATON MODE
        let viewAsPairs = false;
        if (UtilsNew.isNotUndefinedOrNull(response.params.view_as_pairs)) {
            viewAsPairs = true;
        }
        console.log(`viewAsPairs ${viewAsPairs}`);
        if (UtilsNew.isNotUndefinedOrNull(response.params.insert_size_interval)) {
            this.insertSizeMin = response.params.insert_size_interval.split(",")[0];
            this.insertSizeMax = response.params.insert_size_interval.split(",")[1];
        }
        console.log(`insertSizeMin: ${this.insertSizeMin}, insertSizeMax: ${this.insertSizeMax}`);
        // console.log(`insertSizeMax ${insertSizeMax}`);

        // Prevent browser context menu
        $(args.svgCanvasFeatures).contextmenu((e) => {
            console.log("right click");
        });

        console.time(`BamRender ${response.params.resource}`);

        const chunkList = response.items;

        const bamCoverGroup = SVG.addChild(args.svgCanvasFeatures, "g", {
            class: "bamCoverage",
            cursor: "pointer",
        });
        const bamReadGroup = SVG.addChild(args.svgCanvasFeatures, "g", {
            class: "bamReads",
            cursor: "pointer",
        });

        // This other object will contain the strings needed to build the whole polyline to draw the different rows of reads
        const polyDrawing = {};

        // process features
        if (chunkList.length > 0) {
            for (let i = 0, li = chunkList.length; i < li; i++) {
                this._drawCoverage(bamCoverGroup, chunkList[i], args);
                this._addChunks(chunkList[i], polyDrawing, args);
            }
        }

        // Remove old SVGs
        if (args.svgCanvasFeatures.childElementCount > 2) {
            args.svgCanvasFeatures.removeChild(args.svgCanvasFeatures.firstChild);
            args.svgCanvasFeatures.removeChild(args.svgCanvasFeatures.firstChild);
        }

        const keys = Object.keys(polyDrawing);
        for (let i = 0; i < keys.length; i++) {
            const features = args.renderedArea[keys[i]];

            this._renderReadsAndToolTips(bamReadGroup, polyDrawing[keys[i]].reads, 1, features, args);
            this._renderReadsAndToolTips(bamReadGroup, polyDrawing[keys[i]].lowQualityReads, this.lowQualityOpacity, features, args);

            // Render differences
            this._addDifferencesSVG(bamReadGroup, polyDrawing[keys[i]].differences.A, "#009900");
            this._addDifferencesSVG(bamReadGroup, polyDrawing[keys[i]].differences.T, "#aa0000");
            this._addDifferencesSVG(bamReadGroup, polyDrawing[keys[i]].differences.C, "#0000ff");
            this._addDifferencesSVG(bamReadGroup, polyDrawing[keys[i]].differences.G, "#857a00");
            this._addDifferencesSVG(bamReadGroup, polyDrawing[keys[i]].differences.N, "#888");
            this._addDifferencesSVG(bamReadGroup, polyDrawing[keys[i]].differences.D, "#000");
            if (polyDrawing[keys[i]].differences.I.length > 0) {
                const text = SVG.addChild(bamReadGroup, "text", {
                    y: parseInt(keys[i]) + polyDrawing[keys[i]].config.height,
                    class: "ocb-font-ubuntumono ocb-font-size-15",
                });
                for (let j = 0; j < polyDrawing[keys[i]].differences.I.length; j++) {
                    const diff = polyDrawing[keys[i]].differences.I[j];
                    const t = SVG.addChild(text, "tspan", {
                        x: diff.pos - (diff.size / 2),
                        // "font-weight": 'bold',
                        textLength: diff.size,
                    });
                    t.textContent = "|";
                    $(t).qtip({
                        content: { text: diff.seq, title: "Insertion" },
                        position: { target: "mouse", adjust: { x: 25, y: 15 } },
                        style: { classes: `${this.toolTipfontClass} qtip-dark qtip-shadow` },
                    });
                }
            }
        }

        console.timeEnd(`BamRender ${response.params.resource}`);
    }


    getDefaultConfig() {
        return {
            asPairs: true,
            minMapQ: 20, // Reads with a mapping quality under 20 will have a transparency
            lowQualityOpacity: 0.5,
            readColor: "darkgrey",
            infoWidgetId: "id",
            height: 10,
            histogramColor: "grey",
            insertSizeMin: 0,
            insertSizeMax: 0,
            explainFlags(f) {
                var summary = "<div style=\"background:#FFEF93;font-weight:bold;margin:0 15px 0 0;\">flags </div>";
                if (f.numberReads > 1) {
                    summary += "read paired<br>";
                }
                if (!f.improperPlacement) {
                    summary += "read mapped in proper pair<br>";
                }
                if (typeof f.nextMatePosition === "undefined") {
                    summary += "mate unmapped<br>";
                }
                if (f.readNumber === 0) {
                    summary += "first in pair<br>";
                }
                if (f.readNumber === (f.numberReads - 1)) {
                    summary += "second in pair<br>";
                }
                if (f.secondaryAlignment) {
                    summary += "not primary alignment<br>";
                }
                if (f.failedVendorQualityChecks) {
                    summary += "read fails platform/vendor quality checks<br>";
                }
                if (f.duplicateFragment) {
                    summary += "read is PCR or optical duplicate<br>";
                }
                return summary;
            },
            label(f) {
                return "Alignment  " + f.fragmentName + ":" + f.alignment.position.position + "-"
                    + (f.alignment.position.position + f.alignedSequence.length - 1);
            },
            tooltipTitle(f) {
                return "Alignment" + " - <span class=\"ok\">" + f.id + "</span>";
            },
            tooltipText(f) {
                f.strand = this.strand(f);

                var strand = (f.strand != null) ? f.strand : "NA";
                const region = `start-end:&nbsp;<span style="font-weight: bold">${f.start}-${f.end} (${strand})</span><br>`
                    +
                    // `strand:&nbsp;<span style="font-weight: bold">${strand}</span><br>` +
                    `length:&nbsp;<span style="font-weight: bold; color:#005fdb">${(f.end - f.start + 1).toString()
                        .replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")}</span><br>`;
                var one =
                    "cigar:&nbsp;<span class=\"ssel\">" + f.cigar + "</span><br>" +
                    "insert size:&nbsp;<span class=\"ssel\">" + f.fragmentLength + "</span><br>" +
                    region + "<br>" +
                    // this.explainFlags(f.flags);
                    this.explainFlags(f);

                var three = "<div style=\"background:#FFEF93;font-weight:bold;\">attributes</div>";
                let keys = Object.keys(f.info);
                for (let i in keys) {
                    three += keys[i] + " : " + f.info[keys[i]][0] + " : " + f.info[keys[i]][1] + "<br>";
                }
                // delete f.attributes["BQ"];//for now because is too long
                // for (var key in f.attributes) {
                //     three += key + ":" + f.attributes[key] + "<br>";
                // }
                var style = "background:#FFEF93;font-weight:bold;";
                return "<div style=\"float:left\">" + one + "</div>" +
                    "<div style=\"float:right\">" + three + "</div>";
            },
            color(f, chr) {
                if (f.nextMatePosition.referenceName != chr) {
                    return "DarkGray";
                }
                return f.alignment.position.strand === "POS_STRAND" ? "DarkGray" : "LightGray";
                /**/
            },
            strokeColor(f) {
                if (this.mateUnmappedFlag(f)) {
                    return "tomato"
                }
                return f.alignment.position.strand === "POS_STRAND" ? "LightGray" : "DarkGray";
            },
            strand(f) {
                return f.alignment.position.strand === "POS_STRAND" ? "Forward" : "Reverse";
            },
            readPairedFlag(f) {
                return (parseInt(f.flags) & (0x1)) == 0 ? false : true;
            },
            firstOfPairFlag(f) {
                return (parseInt(f.flags) & (0x40)) == 0 ? false : true;
            },
            mateUnmappedFlag(f) {
                return f.nextMatePosition === undefined;
            }
        };
    }

    _addChunks(chunk, polyDrawing, args) {
        const alignments = chunk.alignments;
        if (this.asPairs) {
            const alignmentHash = this._pairReads(alignments);
            const ids = Object.keys(alignmentHash);
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                if (alignmentHash[id].length === 2) {
                    this._addPairedReads(alignmentHash[id], polyDrawing, args);
                } else {
                    this._addSingleRead(alignmentHash[id][0], polyDrawing, args);
                }
            }
        } else {
            for (let i = 0; i < alignments.length; i++) {
                this._addSingleRead(alignments[i], polyDrawing, args);
            }
        }
    }

    _drawCoverage(svgGroup, chunk, args) {
        let coverageList = chunk.coverage.value;

        const start = parseInt(chunk.region.start);
        const end = parseInt(chunk.region.end);
        const pixelWidth = (end - start + 1) * args.pixelBase;

        const middle = args.width / 2;

        const covHeight = 50;

        const histogram = [];
        const length = coverageList.length;
        const maximumValue = Math.max.apply(null, coverageList);
        let points = "";

        if (maximumValue > 0) {
            const maxValueRatio = covHeight / maximumValue;
            let previousCoverage = -1;
            let previousPosition = -1;

            const startPoint = args.pixelPosition + middle - ((args.position - start) * args.pixelBase);
            histogram.push(`${startPoint},${covHeight}`);
            // eslint-disable-next-line no-plusplus
            for (let i = 0; i < length; i++) {
                if (coverageList[i] !== previousCoverage) {
                    previousCoverage = coverageList[i];
                    if (previousPosition + 1 < i) {
                        // We need to add the previous position as well to make a flat line between positions with equal coverage
                        const x = args.pixelPosition + middle - ((args.position - (start + (i - 1))) * args.pixelBase);
                        const y = covHeight - (coverageList[i - 1] * maxValueRatio);

                        histogram.push(`${x},${y}`);
                    }
                    previousPosition = i;

                    const x = args.pixelPosition + middle - ((args.position - (start + i)) * args.pixelBase);
                    const y = covHeight - (coverageList[i] * maxValueRatio);
                    histogram.push(`${x},${y}`);
                }
            }

            const x = args.pixelPosition + middle - ((args.position - (start + length)) * args.pixelBase);
            const y = covHeight - (coverageList[length - 1] * maxValueRatio);
            histogram.push(`${x},${y}`);
            histogram.push(`${x},${covHeight}`);
            points = histogram.join(" ");
        } else {
            const x1 = args.pixelPosition + middle - ((args.position - (start)) * args.pixelBase);
            const x2 = args.pixelPosition + middle - ((args.position - (start + length)) * args.pixelBase);
            points = `${x1},${covHeight} ${x2},${covHeight}`;
        }

        const dummyRect = SVG.addChild(svgGroup, "polyline", {
            points,
            stroke: "lightgrey",
            fill: "lightgrey",
            width: pixelWidth,
            height: covHeight,
            cursor: "pointer",
        });

        $(dummyRect).qtip({
            content: " ",
            position: { target: "mouse", adjust: { x: 15, y: 0 }, viewport: $(window), effect: false },
            style: { width: true, classes: `${this.toolTipfontClass} ui-tooltip-shadow` },
            show: { delay: 300 },
            hide: { delay: 300 },
        });


        args.trackListPanel.on("mousePosition:change", (e) => {
            const pos = e.mousePos - parseInt(start);
            if (pos < 0 || pos >= coverageList.length) {
                return;
            }

            const str = `depth: <span class="ssel">${coverageList[pos]}</span><br>`;
            $(dummyRect).qtip("option", "content.text", str);

        });
    }

    _analyseRead(feature, args) {
        let differences = [];

        let start = feature.alignment.position.position;

        let cigar = "";
        let relativePosition = 0;
        const insertions = [];

        let myLength;
        for (const i in feature.alignment.cigar) {
            cigar += feature.alignment.cigar[i].operationLength;
            switch (feature.alignment.cigar[i].operation) {
            case "CLIP_SOFT":
                cigar += "S";
                break;
            case "ALIGNMENT_MATCH":
                cigar += "M";
                relativePosition += parseInt(feature.alignment.cigar[i].operationLength);
                break;
            case "INSERT":
                cigar += "I";
                myLength = parseInt(feature.alignment.cigar[i].operationLength);

                // We put this here because it will be read to calculate the position of the mismatches
                insertions.push({
                    pos: relativePosition,
                    length: myLength,
                });

                differences.push({
                    pos: relativePosition,
                    seq: feature.alignedSequence.slice(relativePosition, relativePosition + myLength),
                    op: "I",
                    length: myLength,
                });
                break;
            case "DELETE":
                cigar += "D";
                myLength = parseInt(feature.alignment.cigar[i].operationLength);
                differences.push({
                    pos: relativePosition,
                    op: "D",
                    length: myLength,
                });
                relativePosition += myLength;
                break;
            case "SKIP":
                cigar += "N";
                relativePosition += parseInt(feature.alignment.cigar[i].operationLength);
                break;
            default:
            }
        }
        feature.cigar = cigar;

        const end = start + relativePosition - 1;

        feature.start = start;
        feature.end = end;

        if (feature.info.hasOwnProperty("MD")) {
            const md = feature.info.MD[1];
            const matches = md.match(/([0-9]+)|([^0-9]+)/g);
            let position = 0;

            if (feature.alignment.cigar[0].operation === "CLIP_SOFT") {
                position = parseInt(feature.alignment.cigar[0].operationLength);
            }

            // This variable will contain the offset between the insertion and the position where the mismatch is
            // Imagine we have this sequence ACTGCT, and we have an insertion in position 3 and a mismatch in position 5
            // The mismatch will be in position 5 of the sequence, but located in position 4 when showed relative to the
            // reference genome.
            let offset = position;
            for (let i = 0; i < matches.length; i++) {
                if (i % 2 === 0) {
                    // Number
                    position += parseInt(matches[i]);
                } else {
                    if (insertions.length > 0) {
                        for (let j = 0; j < insertions.length; j++) {
                            if (insertions[j].pos < position) {
                                position += insertions[j].length;
                                offset += insertions[j].length;
                                insertions[j].pos = Infinity;
                            } else {
                                break;
                            }
                        }
                    }

                    // Not deletion
                    if (matches[i][0] !== "^") {
                        // Reference nucleotide
                        if (matches[i] === feature.alignedSequence[position]) {
                            console.log("Something strange happened. The mismatch matches the nucleotide of the reference genome?")
                        }

                        differences.push({
                            pos: position - offset,
                            seq: feature.alignedSequence[position],
                            op: "M",
                            length: 1,
                        });

                        position += 1;
                    } else {
                        // -1 because we should not count the ^
                        offset -= matches[i].length - 1;
                    }
                }
            }
        }

        // get feature render configuration
        let color = _.isFunction(this.color) ? this.color(feature, args.region.chromosome) : this.color;
        const mateUnmappedFlag = _.isFunction(this.mateUnmappedFlag) ? this.mateUnmappedFlag(feature) : this.mateUnmappedFlag;

        if (this.insertSizeMin != 0 && this.insertSizeMax != 0 && !mateUnmappedFlag) {
            if (Math.abs(feature.inferredInsertSize) > this.insertSizeMax) {
                color = "maroon";
            }
            if (Math.abs(feature.inferredInsertSize) < this.insertSizeMin) {
                color = "navy";
            }
        }

        return [differences, relativePosition];
    }

    _processDifferencesInRead(differences, polyDrawing, start, height, rowY, args) {
        if (typeof differences === "undefined" || differences.length === 0) {
            return;
        }

        for (let i = 0; i < differences.length; i++) {
            let diff = differences[i];
            let tmpStart = this.getFeatureX(diff.pos + start, args);
            let tmpEnd = tmpStart + args.pixelBase;

            if (diff.op === "M") {
                const rectangle = `M${tmpStart} ${rowY} V${rowY + height} H${tmpEnd} V${rowY} H${tmpStart}`;
                polyDrawing[rowY].differences[diff.seq].push(rectangle);
            } else if (diff.op === "I") {
                diff.pos = tmpStart;
                diff.size = args.pixelBase;
                polyDrawing[rowY].differences[diff.op].push(diff);
            } else if (diff.op === "D") {
                tmpEnd = tmpStart + args.pixelBase * diff.length;
                // Deletion as a line or as a cross
                // Line
                const line = `M${tmpStart} ${rowY + (height / 2)} H${tmpEnd} H${tmpStart}`;
                // Cross
                polyDrawing[rowY].differences[diff.op].push(line);
            } else {
                console.log(`Unexpected difference found: ${diff.op}`);
            }
        }
    }

    _addPairedReads(features, polyDrawing, args) {
        // Initialise the differences object to contain the differences of each read
        let differences = [];
        let myLengths = [];

        for (let i = 0; i < features.length; i++) {
            let [myDifferences, length] = this._analyseRead(features[i], args);
            differences.push(myDifferences);
            myLengths.push(length);
        }

        // transform to pixel position
        let width = myLengths[0] * args.pixelBase;
        let widthPair = myLengths[1] * args.pixelBase;
        // calculate x to draw svg rect
        let x = this.getFeatureX(features[0].alignment.position.position, args);
        let xPair = this.getFeatureX(features[1].alignment.position.position, args);

        // We write additionally the coordinates used by each read to be able to easily select the tooltip to be shown in each case
        features[0]._coordinates = [x, x + width];
        features[1]._coordinates = [xPair, xPair + widthPair];

        let height = _.isFunction(this.height) ? this.height(features[0]) : this.height;

        let rowHeight = 15;
        let rowY = 70;
        // var textY = 12+settings.height;
        let readFitted = false;
        do {
            if (UtilsNew.isUndefinedOrNull(args.renderedArea[rowY])) {
                args.renderedArea[rowY] = new FeatureBinarySearchTree();
            }
            if (UtilsNew.isUndefinedOrNull(polyDrawing[rowY])) {
                polyDrawing[rowY] = {
                    reads: [],
                    lowQualityReads: [],
                    differences: {
                        A: [],
                        T: [],
                        C: [],
                        G: [],
                        N: [],
                        I: [],
                        D: [],
                    },
                    config: {
                        height,
                    },
                };
            }

            let enc = args.renderedArea[rowY].add({ start: x, end: xPair + widthPair - 1, features });
            if (enc) {
                const points = {
                    Reverse: `M${x} ${rowY + (height / 2)} L${x + 5} ${rowY} H${x + width} V${rowY + height} H${x + 5} 
                            L${x} ${rowY + (height / 2)} `,
                    Forward: `M${x} ${rowY} H${x + width - 5} L${x + width} ${rowY + (height / 2)} L${x + width - 5} ${rowY + height} 
                            H${x} V${rowY} `,
                };

                const paired_points = {
                    Reverse: `M${xPair} ${rowY + (height / 2)} L${xPair + 5} ${rowY} H${xPair + widthPair} V${rowY + height} H${xPair + 5} 
                            L${xPair} ${rowY + (height / 2)} `,
                    Forward: `M${xPair} ${rowY} H${xPair + widthPair - 5} L${xPair + widthPair} ${rowY + (height / 2)} 
                            L${xPair + widthPair - 5} ${rowY + height} H${xPair} V${rowY} `,
                };

                let strand = _.isFunction(this.strand) ? this.strand(features[0]) : this.strand;
                if (features[0].alignment.mappingQuality > this.minMapQ) {
                    polyDrawing[rowY].reads.push(points[strand]);
                } else {
                    polyDrawing[rowY].lowQualityReads.push(points[strand]);
                }

                // TODO: Draw the line connecting the reads
                polyDrawing[rowY].reads.push(`M${x + width} ${rowY + (height / 2)} H${xPair} H${x + width}`);

                strand = _.isFunction(this.strand) ? this.strand(features[1]) : this.strand;
                if (features[1].alignment.mappingQuality > this.minMapQ) {
                    polyDrawing[rowY].reads.push(paired_points[strand]);
                } else {
                    polyDrawing[rowY].lowQualityReads.push(paired_points[strand]);
                }

                // PROCESS differences
                if (args.regionSize < 1000) {
                    this._processDifferencesInRead(differences[0], polyDrawing, features[0].alignment.position.position, height, rowY,
                        args);
                    this._processDifferencesInRead(differences[1], polyDrawing, features[1].alignment.position.position, height, rowY,
                        args);
                }
                readFitted = true;
            }
            rowY += rowHeight;
        } while (!readFitted)
    }


    _addSingleRead(feature, polyDrawing, args) {

        let [differences, length] = this._analyseRead(feature, args);
        let start = feature.alignment.position.position;
        let height = _.isFunction(this.height) ? this.height(feature) : this.height;
        let strand = _.isFunction(this.strand) ? this.strand(feature) : this.strand;

        // transform to pixel position
        const width = length * args.pixelBase;
        // calculate x to draw svg rect
        const x = this.getFeatureX(start, args);

        const maxWidth = width;

        const rowHeight = 15;
        let rowY = 70;
        // var textY = 12+settings.height;
        let readFitted = false;
        do {
            if (UtilsNew.isUndefinedOrNull(args.renderedArea[rowY])) {
                args.renderedArea[rowY] = new FeatureBinarySearchTree();
            }
            if (UtilsNew.isUndefinedOrNull(polyDrawing[rowY])) {
                polyDrawing[rowY] = {
                    reads: [],
                    lowQualityReads: [],
                    differences: {
                        A: [],
                        T: [],
                        C: [],
                        G: [],
                        N: [],
                        I: [],
                        D: [],
                    },
                    config: {
                        height,
                    },
                };
            }

            let features = [feature];
            const enc = args.renderedArea[rowY].add({ start: x, end: x + maxWidth - 1, features });
            if (enc) {
                const points = {
                    Reverse: `M${x} ${rowY + (height / 2)} L${x + 5} ${rowY} H${x + width} V${rowY + height} H${x + 5} 
                            L${x} ${rowY + (height / 2)} `,
                    Forward: `M${x} ${rowY} H${x + width - 5} L${x + width} ${rowY + (height / 2)} L${x + width - 5} ${rowY + height} 
                            H${x} V${rowY} `,
                };

                if (feature.alignment.mappingQuality > this.minMapQ) {
                    polyDrawing[rowY].reads.push(points[strand]);
                } else {
                    polyDrawing[rowY].lowQualityReads.push(points[strand]);
                }

                // PROCESS differences
                if (args.regionSize < 1000) {
                    this._processDifferencesInRead(differences, polyDrawing, start, height, rowY, args);
                }
                readFitted = true;
            }
            rowY += rowHeight;
        } while (!readFitted)
    }

    /**
     * Taking an array of alignments as an input that can have any possible order, it will return an object of the form
     * {
         *  alignmentId: [read, mate] (or just [read] where no mate was found)
         * }
     * @param alignments
     */
    _pairReads(alignments) {
        const alignmentHash = {};
        // We build a temporal structure for faster retrieval of alignments
        for (let i = 0; i < alignments.length; i++) {
            const id = alignments[i].id;
            if (typeof alignmentHash[id] === "undefined") {
                alignmentHash[id] = [alignments[i]];
            } else {
                let pos_new_alignment = alignments[i].alignment.position.position;
                let pos_stored_alignment = alignmentHash[id][0].alignment.position.position;

                if (pos_stored_alignment === pos_new_alignment) {
                    // FIXME: For some reason, the webservice is some times returning the exactly same read more than once.
                    continue;
                }
                // Order the alignments to be rendered properly
                if (pos_new_alignment > pos_stored_alignment) {
                    alignmentHash[id].push(alignments[i]);
                } else {
                    alignmentHash[id].unshift(alignments[i]);
                }
            }
        }

        return alignmentHash;
    }

    _addDifferencesSVG(svgBase, array, color) {
        if (array === null || array.length === 0) {
            return;
        }
        SVG.addChild(svgBase, "path", {
            d: array.join(" "),
            stroke: color,
            "stroke-width": 0.7,
            fill: color,
            "fill-opacity": 0.5,
        });
    }

    _renderReadsAndToolTips(svgGroup, reads, opacity, features, args) {
        if (reads.length === 0) {
            return;
        }

        const svgChild = SVG.addChild(svgGroup, "path", {
            d: reads.join(" "),
            stroke: "black",
            "stroke-width": 0.5,
            fill: this.readColor,
            "fill-opacity": opacity,
            cursor: "pointer",
        });

        $(svgChild).qtip({
            content: {
                title: "",
                text: "",
            },
            position: { target: "mouse", adjust: { x: 25, y: 15 } },
            style: { width: 300, classes: `${this.toolTipfontClass} ui-tooltip ui-tooltip-shadow` },
            hide: {
                event: "mousedown mouseup mouseleave",
                delay: 30,
                fixed: true,
            },
        });

        let _this = this;
        svgChild.onmouseover = function () {
            let position = _this.getFeatureX(args.trackListPanel.mousePosition, args);
            let reads = features.get({ start: position, end: position }).value.features;
            if (reads.length === 1) {
                $(svgChild).qtip("option", "content.text", _this.tooltipText(reads[0]));
                $(svgChild).qtip("option", "content.title", _this.tooltipTitle(reads[0]));
            } else {
                if (position < reads[0]._coordinates[1]) {
                    $(svgChild).qtip("option", "content.text", _this.tooltipText(reads[0]));
                    $(svgChild).qtip("option", "content.title", _this.tooltipTitle(reads[0]));
                } else if (position > reads[1]._coordinates[0]) {
                    $(svgChild).qtip("option", "content.text", _this.tooltipText(reads[1]));
                    $(svgChild).qtip("option", "content.title", _this.tooltipTitle(reads[1]));
                }
            }
        };

    }

}
/**
 * Any object with chromosome, start and end
 */
class FeatureRenderer extends Renderer {

    constructor(args) {
        super(args);

        if (args === null) {
            args = FEATURE_TYPES.undefined;
        }

        Object.assign(this, args);

        // Extend and add Backbone Events
        Object.assign(this, Backbone.Events);
        this.on(this.handlers);
    }

    render(features, args) {
        console.time("Generic Feature Render");

        let svgGroup = SVG.create("g");
        for (let i = 0; i < features.length; i++) {
            let feature = features[i];

            if ("featureType" in feature) {
                Object.assign(this, FEATURE_TYPES[feature.featureType]);
            }
            if ("featureClass" in feature) {
                Object.assign(this, FEATURE_TYPES[feature.featureClass]);
            }

            // FIXME Temporal fix for clinical
            if (args.featureType === "clinical") {
                if ("clinvarSet" in feature) {
                    Object.assign(this, FEATURE_TYPES["Clinvar"]);
                } else if ("mutationID" in feature) {
                    Object.assign(this, FEATURE_TYPES["Cosmic"]);
                } else {
                    Object.assign(this, FEATURE_TYPES["GWAS"]);
                }
            }

            // get feature render configuration
            let color = _.isFunction(this.color) ? this.color(feature) : this.color;
            let strokeColor = _.isFunction(this.strokeColor) ? this.color(feature) : this.strokeColor;
            let label = _.isFunction(this.label) ? this.label(feature) : this.label;
            let height = _.isFunction(this.height) ? this.height(feature) : this.height;
            let tooltipTitle = _.isFunction(this.tooltipTitle) ? this.tooltipTitle(feature) : this.tooltipTitle;
            let tooltipText = _.isFunction(this.tooltipText) ? this.tooltipText(feature) : this.tooltipText;
            let infoWidgetId = _.isFunction(this.infoWidgetId) ? this.infoWidgetId(feature) : this.infoWidgetId;

            // get feature genomic information
            let start = feature.start;
            let end = feature.end;
            let length = (end - start) + 1;

            // check genomic length
            length = (length < 0) ? Math.abs(length) : length;
            length = (length === 0) ? 1 : length;

            // transform to pixel position
            let width = length * args.pixelBase;

            let svgLabelWidth = label.length * 6.4;

            //calculate x to draw svg rect
            let x = this.getFeatureX(start, args);

            let maxWidth = Math.max(width, 2);
            let textHeight = 0;
            if (args.maxLabelRegionSize > args.regionSize) {
                textHeight = 9;
                maxWidth = Math.max(width, svgLabelWidth);
            }

            let rowY = 0;
            let textY = textHeight + height;
            let rowHeight = textHeight + height + 2;

            while (true) {
                if (!(rowY in args.renderedArea)) {
                    args.renderedArea[rowY] = new FeatureBinarySearchTree();
                }

                let foundArea = args.renderedArea[rowY].add({start: x, end: x + maxWidth - 1});
                if (foundArea) {
                    let featureGroup = SVG.addChild(svgGroup, "g", {"feature_id": feature.id});
                    let rect = SVG.addChild(featureGroup, "rect", {
                        "x": x,
                        "y": rowY,
                        "width": width,
                        "height": height,
                        "stroke": strokeColor,
                        "stroke-width": 1,
                        "stroke-opacity": 0.7,
                        "fill": color,
                        "cursor": "pointer"
                    });

                    if (args.maxLabelRegionSize > args.regionSize) {
                        let text = SVG.addChild(featureGroup, "text", {
                            "i": i,
                            "x": x,
                            "y": textY,
                            "font-weight": 400,
                            "opacity": null,
                            "fill": "black",
                            "cursor": "pointer",
                            "class": this.fontClass
                        });
                        text.textContent = label;
                    }

                    if ("tooltipText" in this) {
                        $(featureGroup).qtip({
                            content: {text: tooltipText, title: tooltipTitle},
                            position: {viewport: $(window), target: "mouse", adjust: {x: 25, y: 15}},
                            style: {width: true, classes: this.toolTipfontClass + " ui-tooltip ui-tooltip-shadow"},
                            show: {delay: 300},
                            hide: {delay: 300}
                        });
                    }

                    $(featureGroup).mouseover(function (event) {
                        this.dispatchEvent(new CustomEvent("feature:mouseover",
                                {detail:{
                                    query: feature[infoWidgetId],
                                    feature: feature,
                                    featureType: feature.featureType,
                                    mouseoverEvent: event
                                },
                                    composed: true // for IE
                                })
                        );
                    });

                    $(featureGroup).click(function (event) {
                        this.dispatchEvent(new CustomEvent("feature:click",
                                {detail:{
                                    query: feature[infoWidgetId],
                                    feature: feature,
                                    featureType: feature.featureType,
                                    clickEvent: event
                                },
                                    composed: true //for IE
                                })
                        );
                    });
                    break;
                }
                rowY += rowHeight;
                textY += rowHeight;
            }
        }
        args.svgCanvasFeatures.appendChild(svgGroup);

        console.timeEnd("Generic Feature Render");
    }
}
class GeneRenderer extends Renderer {

    constructor(args) {
        super(args);
        //Extend and add Backbone Events
        Object.assign(this, Backbone.Events);

        this.fontClass = "ocb-font-roboto ocb-font-size-11";
        this.toolTipfontClass = "ocb-tooltip-font";

        if (_.isObject(args)) {
            Object.assign(this, args);
        }

        this.on(this.handlers);
    }

    setFeatureConfig(configObject) {
        Object.assign(this, configObject);
    }

    render(features, args) {
        let _this = this;
        let draw = function (feature) {
            // get feature render configuration
            _this.setFeatureConfig(_this.getDefaultConfigGene().gene);
            let color = _.isFunction(_this.color) ? _this.color(feature) : _this.color;
            let label = _.isFunction(_this.label) ? _this.label(feature) : _this.label;
            let height = _.isFunction(_this.height) ? _this.height(feature) : _this.height;
            let tooltipTitle = _.isFunction(_this.tooltipTitle) ? _this.tooltipTitle(feature) : _this.tooltipTitle;
            let tooltipText = _.isFunction(_this.tooltipText) ? _this.tooltipText(feature) : _this.tooltipText;
            let infoWidgetId = _.isFunction(_this.infoWidgetId) ? _this.infoWidgetId(feature) : _this.infoWidgetId;

            // get feature genomic information
            let start = feature.start;
            let end = feature.end;
            let length = (end - start) + 1;

            // transform to pixel position
            let width = length * args.pixelBase;

            // var svgLabelWidth = _this.getLabelWidth(label, args);
            let svgLabelWidth = label.length * 6.4;

            // calculate x to draw svg rect
            let x = _this.getFeatureX(start, args);

            let maxWidth = Math.max(width, 2);
            let textHeight = 0;
            if (args.maxLabelRegionSize > args.regionSize) {
                textHeight = 9;
                maxWidth = Math.max(width, svgLabelWidth);
            }

            let rowY = 0;
            let textY = textHeight + height + 1;
            let rowHeight = textHeight + height + 5;

            while (true) {
                if (!(rowY in args.renderedArea)) {
                    args.renderedArea[rowY] = new FeatureBinarySearchTree();
                }

                let foundArea;//if true, i can paint

                // check if gene transcripts can be painted
                let checkRowY = rowY;
                let foundTranscriptsArea = true;
                if (!_.isEmpty(feature.transcripts)) {
                    for (let i = 0, leni = feature.transcripts.length + 1; i < leni; i++) {
                        if (!(checkRowY in args.renderedArea)) {
                            args.renderedArea[checkRowY] = new FeatureBinarySearchTree();
                        }
                        if (args.renderedArea[checkRowY].contains({start: x, end: x + maxWidth - 1})) {
                            foundTranscriptsArea = false;
                            break;
                        }
                        checkRowY += rowHeight;
                    }
                    if (foundTranscriptsArea === true) {
                        foundArea = args.renderedArea[rowY].add({start: x, end: x + maxWidth - 1});
                    }
                } else {
                    foundArea = args.renderedArea[rowY].add({start: x, end: x + maxWidth - 1});
                }

                // paint genes
                if (foundArea) {
                    let featureGroup = SVG.addChild(args.svgCanvasFeatures, "g", {
                        "feature_id": feature.id
                    });
                    let rect = SVG.addChild(featureGroup, "rect", {
                        "x": x,
                        "y": rowY,
                        "width": width,
                        "height": height,
                        "stroke": "#3B0B0B",
                        "stroke-width": 0.5,
                        "fill": color,
                        "cursor": "pointer"
                    });

                    if (args.maxLabelRegionSize > args.regionSize) {
                        let text = SVG.addChild(featureGroup, "text", {
                            "i": i,
                            "x": x,
                            "y": textY,
                            "fill": "black",
                            "cursor": "pointer",
                            "class": _this.fontClass
                        });
                        text.textContent = label;
                    }

                    $(featureGroup).qtip({
                        content: {text: tooltipText, title: tooltipTitle},
                        // position: {target: "mouse", adjust: {x: 15, y: 0}, viewport: $(window), effect: false},
                        position: {target: "mouse", adjust: {x: 25, y: 15}},
                        style: {width: true, classes: _this.toolTipfontClass + " ui-tooltip ui-tooltip-shadow"},
                        show: {delay: 300},
                        hide: {delay: 300}
                    });


                    featureGroup.addEventListener("click", function (e) {
                        _this.trigger("feature:click", {
                            query: feature[infoWidgetId],
                            feature: feature,
                            featureType: "gene",
                            clickEvent: e
                        });
                    });

                    //paint transcripts
                    let checkRowY = rowY + rowHeight;
                    let checkTextY = textY + rowHeight;
                    if (!_.isEmpty(feature.transcripts)) {
                        /* warning not change var i */
                        for (var i = 0, leni = feature.transcripts.length; i < leni; i++) { /*Loop over transcripts*/
                            if (!(checkRowY in args.renderedArea)) {
                                args.renderedArea[checkRowY] = new FeatureBinarySearchTree();
                            }
                            let transcript = feature.transcripts[i];
                            let transcriptX = _this.getFeatureX(transcript.start, args);
                            let transcriptWidth = (transcript.end - transcript.start + 1) * ( args.pixelBase);

                            //get type settings object
                            _this.setFeatureConfig(_this.getDefaultConfigGene().transcript);
                            let transcriptColor = _.isFunction(_this.color) ? _this.color(transcript) : _this.color;
                            let label = _.isFunction(_this.label) ? _this.label(transcript) : _this.label;
                            let height = _.isFunction(_this.height) ? _this.height(transcript) : _this.height;
                            let tooltipTitle = _.isFunction(_this.tooltipTitle) ? _this.tooltipTitle(transcript) : _this.tooltipTitle;
                            let tooltipText = _.isFunction(_this.tooltipText) ? _this.tooltipText(transcript) : _this.tooltipText;
                            let infoWidgetId = _.isFunction(_this.infoWidgetId) ? _this.infoWidgetId(transcript) : _this.infoWidgetId;

                            //the length of the end of the gene is subtracted to the beginning of the transcript and is added the text of the transcript

                            let svgLabelWidth = label.length * 6.4;
                            let maxWidth = Math.max(width, width - ((feature.end - transcript.start) * ( args.pixelBase)) + svgLabelWidth);


                            //add to the tree the transcripts size
                            args.renderedArea[checkRowY].add({start: x, end: x + maxWidth - 1});


                            let transcriptGroup = SVG.addChild(args.svgCanvasFeatures, "g", {
                                "data-widget-id": transcript[infoWidgetId],
                                "data-transcript-idx": i
                            });


                            let rect = SVG.addChild(transcriptGroup, "rect", {//this rect its like a line
                                "x": transcriptX,
                                "y": checkRowY + 1,
                                "width": transcriptWidth,
                                "height": height,
                                "fill": "gray",
                                "cursor": "pointer",
                                "feature_id": transcript.id
                            });
                            let text = SVG.addChild(transcriptGroup, "text", {
                                "x": transcriptX,
                                "y": checkTextY,
                                "fill": "black",
                                "cursor": "pointer",
                                "class": _this.fontClass
                            });
                            text.textContent = label;


                            $(transcriptGroup).qtip({
                                content: {text: tooltipText, title: tooltipTitle},
                                // position: {target: 'mouse', adjust: {x: 15, y: 0}, viewport: $(window), effect: false},
                                position: {target: "mouse", adjust: {x: 25, y: 15}},
                                style: {width: true, classes: _this.toolTipfontClass + " ui-tooltip ui-tooltip-shadow"},
                                show: {delay: 300},
                                hide: {delay: 300}
                            });

                            transcriptGroup.addEventListener("click", function (e) {
                                // var query = this.getAttribute('data-widget-id');
                                // var idx = this.getAttribute("data-transcript-idx");
                                // _this.trigger('feature:click', {
                                //     query: query,
                                //     feature: feature.transcripts[idx],
                                //     featureType: 'transcript',
                                //     clickEvent: event
                                // });
                            });


                            //paint exons
                            for (let e = 0, lene = feature.transcripts[i].exons.length; e < lene; e++) {
                                let exon = feature.transcripts[i].exons[e];
                                let exonStart = parseInt(exon.start);
                                let exonEnd = parseInt(exon.end);
                                let middle = args.width / 2;

                                let exonX = args.pixelPosition + middle - ((args.position - exonStart) * args.pixelBase);
                                let exonWidth = (exonEnd - exonStart + 1) * ( args.pixelBase);


                                _this.setFeatureConfig(_this.getDefaultConfigGene().exon);
                                let color = _.isFunction(_this.color) ? _this.color(exon) : _this.color;
                                let label = _.isFunction(_this.label) ? _this.label(exon) : _this.label;
                                let height = _.isFunction(_this.height) ? _this.height(exon) : _this.height;
                                let tooltipTitle = _.isFunction(_this.tooltipTitle) ? _this.tooltipTitle(exon) : _this.tooltipTitle;
                                let tooltipText = _.isFunction(_this.tooltipText) ? _this.tooltipText(exon, transcript) : _this.tooltipText;
                                let infoWidgetId = _.isFunction(_this.infoWidgetId) ? _this.infoWidgetId(exon) : _this.infoWidgetId;

                                let exonGroup = SVG.addChild(args.svgCanvasFeatures, "g", {
                                    "class": "ocb-coding",
                                    "data-id": exon.id
                                });

                                $(exonGroup).qtip({
                                    content: {text: tooltipText, title: tooltipTitle},
                                    // position: {target: 'mouse', adjust: {x: 15, y: 0}, viewport: $(window), effect: false},
                                    position: {target: "mouse", adjust: {x: 25, y: 15}},
                                    style: {
                                        width: true,
                                        classes: _this.toolTipfontClass + " ui-tooltip ui-tooltip-shadow"
                                    },
                                    show: {delay: 300},
                                    hide: {delay: 300}
                                });

                                exonGroup.addEventListener("click", function (e) {
                                    // console.log(this.dataset.id);
                                    // var query = this.getAttribute('data-widget-id');
                                    // var idx = this.getAttribute("data-transcript-idx");
                                    // _this.trigger('feature:click', {
                                    //     query: query,
                                    //     feature: feature.transcripts[idx],
                                    //     featureType: 'transcript',
                                    //     clickEvent: event
                                    // });
                                });


                                // Paint exons in white without coding region
                                let eRect = SVG.addChild(exonGroup, "rect", {
                                    "i": i,
                                    "x": exonX,
                                    "y": checkRowY - 1,
                                    "width": exonWidth,
                                    "height": height,
                                    "stroke": "gray",
                                    "stroke-width": 1,
                                    "fill": "white",
                                    "cursor": "pointer"
                                });

                                let codingLength = exon.genomicCodingEnd - exon.genomicCodingStart;
                                let codingX = args.pixelPosition + middle - ((args.position - exon.genomicCodingStart) * args.pixelBase);
                                let codingReverseX = args.pixelPosition + middle - ((args.position - exon.genomicCodingEnd) * args.pixelBase);
                                let codingWidth = (codingLength + 1) * (args.pixelBase);
                                if (codingLength > 0) {
                                    let cRect = SVG.addChild(exonGroup, "rect", {
                                        "i": i,
                                        "x": codingX,
                                        "y": checkRowY - 1,
                                        "width": codingWidth,
                                        "height": height,
                                        "stroke": transcriptColor,
                                        "stroke-width": 1,
                                        "fill": transcriptColor,
                                        "cursor": "pointer"
                                    });
                                    if (args.pixelBase > 9.5 && transcript.proteinSequence !== null && exon.phase !== null) {
                                        // FIXME This fixes a Cellbase bug, phase=0 are not returned, we have to remove this when fixed
                                        if (typeof exon.phase === "undefined") {
                                            exon.phase = 0;
                                        }

                                        if (exon.strand === "+") {
                                            /* not change var x let*/
                                            var proteinString = transcript.proteinSequence.substring(Math.floor(exon.cdsStart / 3), Math.floor(exon.cdsEnd / 3));
                                            var proteinPhaseOffset = codingX - (((3 - exon.phase) % 3) * args.pixelBase);
                                            var sign = 1;

                                        } else if (exon.strand === "-") {
                                            var proteinString = transcript.proteinSequence.substring(Math.floor(exon.cdsStart / 3), Math.ceil(exon.cdsEnd / 3));
                                            var proteinPhaseOffset = codingReverseX - (args.pixelBase * 2) - (exon.phase * args.pixelBase);
                                            var sign = -1;
                                        }

                                        for (let j = 0; j < proteinString.length; j++) {
                                            let codonRect = SVG.addChild(exonGroup, "rect", {
                                                "x": proteinPhaseOffset + (sign * args.pixelBase * 3 * j ),
                                                "y": checkRowY - 1,
                                                "width": (args.pixelBase * 3),
                                                "height": height,
                                                "stroke": "#3B0B0B",
                                                "stroke-width": 0.5,
                                                "fill": CODON_CONFIG[proteinString.charAt(j)].color,
                                                "class": "ocb-codon"
                                            });
                                            let codonText = SVG.addChild(exonGroup, "text", {
                                                "x": proteinPhaseOffset + (sign * args.pixelBase * j * 3) + args.pixelBase / 3,
                                                "y": checkRowY - 3,
                                                "width": (args.pixelBase * 3),
                                                "class": "ocb-font-ubuntumono ocb-font-size-16 ocb-codon"
                                            });
                                            codonText.textContent = CODON_CONFIG[proteinString.charAt(j)].text;
                                        }
                                    }

                                    // Draw phase only at zoom 100, where this.pixelBase < 11
                                    //if (args.pixelBase < 11 && exon.phase != null && exon.phase != -1) {
                                    //    for (var p = 0, lenp = 3 - exon.phase; p < lenp; p++) {
                                    //        SVG.addChild(exonGroup, "rect", {
                                    //            "i": i,
                                    //            "x": codingX + (p * args.pixelBase),
                                    //            "y": checkRowY - 1,
                                    //            "width": args.pixelBase,
                                    //            "height": height,
                                    //            "stroke": color,
                                    //            "stroke-width": 1,
                                    //            "fill": 'white',
                                    //            "cursor": "pointer"
                                    //        });
                                    //    }
                                    //}
                                }
                            }
                            checkRowY += rowHeight;
                            checkTextY += rowHeight;
                        }
                    }// if transcrips != null
                    break;
                }
                rowY += rowHeight;
                textY += rowHeight;
            }
        };

        //process features
        for (let i = 0, leni = features.length; i < leni; i++) {
            draw(features[i]);
        }
    }

    getDefaultConfigGene() {
        return {
            gene: {
                label(f) {
                    var name = (f.name != null) ? f.name : f.id;
                    var str = "";
                    str += (f.strand < 0 || f.strand == '-') ? "<" : "";
                    str += " " + name + " ";
                    str += (f.strand > 0 || f.strand == '+') ? ">" : "";
                    if (f.biotype != null && f.biotype != '') {
                        str += " [" + f.biotype + "]";
                    }
                    return str;
                },
                tooltipTitle(f) {
                    var name = (f.name != null) ? f.name : f.id;
                    var formatTitle = 'Gene';
                    if (formatTitle) {
                        formatTitle.replace(/_/gi, " ");
                        formatTitle = formatTitle.charAt(0).toUpperCase() + formatTitle.slice(1);
                    }

                    return formatTitle + ' - <span class="ok">' + name + '</span>';
                },
                tooltipText(f) {
                    var color = GENE_BIOTYPE_COLORS[f.biotype];
                    var strand = (f.strand != null) ? f.strand : "NA";
                    const region = `start-end:&nbsp;<span style="font-weight: bold">${f.start}-${f.end} (${strand})</span><br>` +
                        `length:&nbsp;<span style="font-weight: bold; color:#005fdb">${(f.end - f.start + 1).toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")}</span><br>`;
                    return 'id:&nbsp;<span class="ssel">' + f.id + '</span><br>' +
                        'biotype:&nbsp;<span class="emph" style="color:' + color + ';">' + f.biotype + '</span><br>' +
                        region +
                        'source:&nbsp;<span class="ssel">' + f.source + '</span><br><br>' +
                        'description:&nbsp;<span class="emph">' + f.description + '</span><br>';
                },
                color(f) {
                    return GENE_BIOTYPE_COLORS[f.biotype];
                },
                infoWidgetId: "id",
                height: 4,
                histogramColor: "lightblue",
            },
            transcript: {
                label(f) {
                    var name = (f.name != null) ? f.name : f.id;
                    var str = "";
                    str += (f.strand < 0) ? "<" : "";
                    str += " " + name + " ";
                    str += (f.strand > 0) ? ">" : "";
                    if (f.biotype != null && f.biotype != '') {
                        str += " [" + f.biotype + "]";
                    }
                    return str;
                },
                tooltipTitle(f) {
                    var name = (f.name != null) ? f.name : f.id;
                    var formatTitle = 'Transcript';
                    if (formatTitle) {
                        formatTitle.replace(/_/gi, " ");
                        formatTitle = formatTitle.charAt(0).toUpperCase() + formatTitle.slice(1);
                    }
                    return formatTitle +
                        ' - <span class="ok">' + name + '</span>';
                },
                tooltipText(f) {
                    var color = GENE_BIOTYPE_COLORS[f.biotype];
                    var strand = (f.strand != null) ? f.strand : "NA";
                    const region = `start-end:&nbsp;<span style="font-weight: bold">${f.start}-${f.end} (${strand})</span><br>` +
                        `length:&nbsp;<span style="font-weight: bold; color:#005fdb">${(f.end - f.start + 1).toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")}</span><br>`;
                    return 'id:&nbsp;<span class="ssel">' + f.id + '</span><br>' +
                        'biotype:&nbsp;<span class="emph" style="color:' + color + ';">' + f.biotype + '</span><br>' +
                        'description:&nbsp;<span class="emph">' + f.description + '</span><br>' +
                        region;
                },
                color(f) {
                    return GENE_BIOTYPE_COLORS[f.biotype];
                },
                infoWidgetId: "id",
                height: 1,
                histogramColor: "lightblue",
            },
            exon: {
                label(f) {
                    var name = (f.name != null) ? f.name : f.id;
                    return name;
                },
                tooltipTitle(f) {
                    var name = (f.name != null) ? f.name : f.id;
                    if (name == null) {
                        name = '';
                    }
                    var formatTitle = 'Exon';
                    if (formatTitle) {
                        formatTitle.replace(/_/gi, " ");
                        formatTitle = formatTitle.charAt(0).toUpperCase() + formatTitle.slice(1);
                    }
                    return formatTitle + ' - <span class="ok">' + name + '</span>';
                },
                tooltipText(e, t) {
                    // return FEATURE_TYPES.getTipCommons(e) + FEATURE_TYPES._getSimpleKeys(e);
                    let color = GENE_BIOTYPE_COLORS[t.biotype];
                    var strandE = (e.strand != null) ? e.strand : "NA";
                    const region = `start-end:&nbsp;<span style="font-weight: bold">${e.start}-${e.end} (${strandE})</span><br>` +
                        `length:&nbsp;<span style="font-weight: bold; color:#005fdb">${(e.end - e.start + 1).toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")}</span><br>`;
                    var strandT = (t.strand != null) ? t.strand : "NA";
                    const regionT = `start-end:&nbsp;<span style="font-weight: bold">${t.start}-${t.end} (${strandT})</span><br>` +
                        `length:&nbsp;<span style="font-weight: bold; color:#005fdb">${(t.end - t.start + 1).toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")}</span><br>`;

                    var simpleKey = '';
                    for (let key in e) {
                        if (key == 'start' || key == 'end' || key == 'id' || key == 'name' || key == 'length') {
                            continue;
                        }
                        if (_.isNumber(e[key]) || _.isString(e[key])) {
                            simpleKey += key + ':&nbsp;<span style="font-weight: bold">' + e[key] + '</span><br>'
                        }
                    }

                    return `Transcript:<br>
                    <div style="padding-left: 10px">
                        id:&nbsp;<span class="ssel">${t.id}</span><br>
                        biotype:&nbsp;<span class="emph" style="color:${color};">${t.biotype}</span><br>
                        description:&nbsp;<span class="emph">${t.description}</span><br>
                        ${regionT}<br>
                    </div>
                    Exon:<br>
                    <div style="padding-left: 10px">
                        ${region}${simpleKey}
                    </div>
                    `;
                },
                color(f) {
                    return "black";
                },
                infoWidgetId: "id",
                height: 7,
                histogramColor: "lightblue"
            },
        };
    }
}
/**
  @param  args example:
        {
            height: number, <- height of div
            histogramColor: String
            histogramHeight: number <- height of histogram
            histogramMaxFreqValue: number
            ...
        }
 */
class HistogramRenderer extends Renderer {

    constructor(args) {
        super(args);
        //Extend and add Backbone Events
        Object.assign(this, Backbone.Events);

        //set default args
        this.histogramHeight = 75;
        this.histogramColor = "#428bca";

        this.maxValue = 10;
        this.updateScale(args);
        //set instantiation args
        Object.assign(this, args);

    }

    _checkFeatureValue(feature) {
        if (feature.features_count === null) {
            if (feature.absolute !== 0 && feature.absolute > 0) {
                // take care of feature.absolute==1 counts and set scaled value to 0.2 as log(2) ~= 0.3
                feature.features_count = Math.max(0.2, Math.log(feature.absolute));
            } else {
                feature.features_count = 0;
            }
        }
    }

    /**
     * updates "this.multiplier" using "histogramMaxFreqValue" and "height"
     * @param args
     */
    updateScale(args) {
        if (args !== null) {
            if (UtilsNew.isNotUndefinedOrNull(args.height)) {
                this.histogramHeight = args.height * 0.95;
            }
            if (UtilsNew.isNotUndefinedOrNull(args.histogramMaxFreqValue)) {
                this.maxValue = args.histogramMaxFreqValue;
            }
        }
        this.multiplier = this.histogramHeight / this.maxValue;
    }
    /**
    @param features  Array containing chunks example
            [   {chunkKey:"13:3298_histogram_10000"
                 region: Region{chromosome: "13", start:329800000, end:32980016}
                 value:{_id: 1940000, chromosome:"13", start: 32980000, end: 32980016, features_count:0},
                 ...
                 }
            ]
     @param args example
                {pixelPosition: number,
                position: number,
                svgCanvasFeatures
                }

     */
    render(features, args) {
        features.sort(function (a, b) {
            return a.value.start - b.value.start;
        });

        let middle = args.width / 2;
        //console.log(middle);
        let points = "";

        this.updateScale(args);

        if (features.length > 0) {
            let firstFeature = features[0].value;
            let width = (firstFeature.end - firstFeature.start + 1) * args.pixelBase;
            let x = args.pixelPosition + middle - ((args.position - parseInt(firstFeature.start)) * args.pixelBase);

            this._checkFeatureValue(firstFeature);
            let height = firstFeature.features_count * this.multiplier;

            points = (x - (width / 2)).toFixed(1) + "," + this.histogramHeight.toFixed(1) + " ";
            points += (x - (width / 2)).toFixed(1) + "," + (this.histogramHeight - height).toFixed(1) + " ";
        }
        for (let i = 0, len = features.length; i < len; i++) {
            let feature = features[i].value;
            feature.start = parseInt(feature.start);
            feature.end = parseInt(feature.end);
            let width = (feature.end - feature.start + 1) * args.pixelBase;
            let x = args.pixelPosition + middle - ((args.position - feature.start) * args.pixelBase);

            this._checkFeatureValue(feature);
            let height = feature.features_count * this.multiplier;

            points += (x + (width / 2)).toFixed(1) + "," + (this.histogramHeight - height).toFixed(1) + " ";
        }
        if (features.length > 0) {
            let lastFeature = features[features.length - 1].value;
            let width = (lastFeature.end - lastFeature.start + 1) * args.pixelBase;
            let x = args.pixelPosition + middle - ((args.position - parseInt(lastFeature.start)) * args.pixelBase);

            this._checkFeatureValue(lastFeature);
            let height = lastFeature.features_count * this.multiplier;

            points += (x + (width)).toFixed(1) + "," + (this.histogramHeight - height).toFixed(1) + " ";
            points += (x + (width)).toFixed(1) + "," + this.histogramHeight.toFixed(1) + " ";
        }

        if (points !== "") {
            SVG.addChild(args.svgCanvasFeatures, "polyline", {
                "points": points,
                "fill": this.histogramColor,
                "cursor": "pointer"
            });

        }
    }
}
class SequenceRenderer extends Renderer {

    constructor(args) {
        super(args);
        //Extend and add Backbone Events
        Object.assign(this, Backbone.Events);
        this.fontClass = "ocb-font-ubuntumono ocb-font-size-16";
        this.toolTipfontClass = "ocb-tooltip-font";

        Object.assign(this, args);
    }

    render(chunks, args) {
        for (let i = 0; i < chunks.length; i++) {
            this._paintSequenceChunk(chunks[i], args);
        }
    }

    _paintSequenceChunk(chunk, args) {
        /* Time */
        let timeId = new Region(chunk).toString();
        console.time("Sequence render " + timeId);
        /**/

        let middle = args.width / 2;

        let start = chunk.start;
        let seqStart = chunk.start;
        let seqString = chunk.sequence;

        for (let i = 0; i < seqString.length; i++) {
            let x = args.pixelPosition + middle - ((args.position - start) * args.pixelBase);
            let text = SVG.addChild(args.svgCanvasFeatures, "text", {
                "x": x + 1,
                "y": 12,
                "fill": SEQUENCE_COLORS[seqString.charAt(i)],
                "data-pos": start,
                "class": this.fontClass
            });
            start++;
            text.textContent = seqString.charAt(i);
            $(text).qtip({
                content: seqString.charAt(i) + " " + (seqStart + i).toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")/*+'<br>'+phastCons[i]+'<br>'+phylop[i]*/,
                position: {target: "mouse", adjust: {x: 25, y: 15}},
                style: {width: true, classes: this.toolTipfontClass + " qtip-light qtip-shadow"},
                show: {delay: 300},
                hide: {delay: 300}
            });
        }

        /* Time */
        console.timeEnd("Sequence render " + timeId);
        /**/

    }
}
/**
 * Stateless (or almost) object to render variants.
 *
 * If you have a svg element where you want to draw, pass it to VariantRenderer.init()
 * and later, in each VariantRenderer.render() as args.svgCanvasFeatures.
 *
 * @type {Renderer}
 */
class VariantRenderer extends Renderer {

    /*
     *
     * args: {
     *      sampleTrackY = 15,
     *      config: {
     *          height: 10
     *      }
     * }
     */
    constructor(args) {
        super(args);

        this.sampleTrackY = 15;
        this.sampleTrackHeight = 20;
        this.sampleTrackFontSize = 12;
        Object.assign(this, args);

        // Extend and add Backbone Events
        Object.assign(this, Backbone.Events);
        Object.assign(this, this.getDefaultConfig(), this.config);

        this.on(this.handlers);
    }

    init(svgGroup, sample) {
        // Prevent browser context menu
        //console.log(this.track.main);
        $(svgGroup).contextmenu((e) => {
            console.log("right click");
            e.preventDefault();
        });

        // Get sample name array, it can be a string or an array
        if (typeof this.sampleNames === "string") {
            this.sampleNames = this.sampleNames.split(",");
        }

        // FIXME sampleNames should be renderer here but in the variant-track.js
        if (typeof this.sampleNames !== "undefined" && this.sampleNames !== null) {
            let y = this.sampleTrackY;
            for (let i = 0; i < this.sampleNames.length; i++) {
                const sampleSvg = SVG.addChild(this.track.main, "text", {
                    x: 0,
                    y,
                    stroke: "black",
                    "stroke-width": 1,
                    "font-size": this.sampleTrackFontSize,
                    cursor: "pointer",
                });
                sampleSvg.textContent = this.sampleNames[i];

                y += this.sampleTrackHeight;

                const _this = this;
                $(sampleSvg).click(function (event) {
                    const label = $(this);

                    const yrect = label[0].y.baseVal[0].value - 7;
                    if (this.getAttribute("stroke") === "black") {
                        label.css({ stroke: "#ff7200" }).hide(100).show(500).css({ stroke: "#ff7200" });
                        this.setAttribute("stroke", "#ff7200");
                        const rect = SVG.create("rect", {
                            x: 0,
                            y: yrect,
                            width: _this.track.width,
                            height: 8,
                            stroke: "#FFFF00",
                            fill: "#F2F5A9",
                            opacity: 0.5,
                        });
                        rect.setAttribute("id", `${this.innerHTML}_rect${yrect}`);
                        _this.track.main.insertBefore(rect, this);
                    } else {
                        const rect = document.getElementById(`${this.innerHTML}_rect${yrect}`);
                        rect.parentNode.removeChild(rect);
                        this.setAttribute("stroke", "black");
                        label.css({ stroke: "black" });
                    }
                });
            }
        }
    }

    render(features, args) {

        if (typeof this.sampleNames !== "undefined" && this.sampleNames !== null && this.sampleNames.length > 0) {
            this._renderExtendedGenotypes(features, args);
        } else {
            this._renderCompactVariants(features, args);
        }
    }

    _renderExtendedGenotypes(features, args) {
        console.time("Variant Extended GT Renderer");

        for (const feature of features) {
            // get feature render configuration
            const tooltipTitle = _.isFunction(this.tooltipTitle) ? this.tooltipTitle(feature) : this.tooltipTitle;
            const tooltipText = _.isFunction(this.tooltipText) ? this.tooltipText(feature) : this.tooltipText;

            // get feature genomic information
            const start = feature.start;
            const end = feature.end;
            let length = (end - start) + 1;

            // check genomic length
            length = (length < 0) ? Math.abs(length) : length;
            length = (length === 0) ? 1 : length;

            // Transform to pixel position, minimum width set to 1px
            let width = length * args.pixelBase;
            width = Math.max(width, 1);


            // calculate x to draw svg rect
            const x = this.getFeatureX(start, args)

            // Color: Dark blue: 0/0, Orange: 0/1, Red: 1/1, Black: ./.
            let d00 = "";
            let dDD = "";
            let d11 = "";
            let d01 = "";
            const xs = x;         // x start
            const xe = x + width; // x end
            let ys = 5;           // y
            const yi = 10;        // y increment
            const yi2 = this.sampleTrackHeight; // y increment

            let samplesCount = feature.studies[0].samplesData.length;
            for (const i in feature.studies[0].samplesData) {
                const svgPath = `M${xs},${ys} L${xe},${ys} L${xe},${ys + yi} L${xs},${ys + yi} z `;

                // Only one study is expected, and GT is always the first field in samplesData
                const genotype = feature.studies[0].samplesData[i]["0"];
                switch (genotype) {
                case "0|0":
                case "0/0":
                    d00 += svgPath;
                    break;
                case "0|1":
                case "0/1":
                case "1|0":
                case "1/0":
                    d01 += svgPath;
                    break;
                case "1|1":
                case "1/1":
                    d11 += svgPath;
                    break;
                case ".|.":
                case "./.":
                    dDD += svgPath;
                    break;
                }
                ys += yi2;
            }

            const featureGroup = SVG.addChild(args.svgCanvasFeatures, "g", { feature_id: feature.id });
            const dummyRect = SVG.addChild(featureGroup, "rect", {
                x: xs,
                y: 1,
                width,
                height: ys,
                fill: "transparent",
                cursor: "pointer",
            });
            if (d00 !== "") {
                const path = SVG.addChild(featureGroup, "path", {
                    d: d00,
                    fill: "blue",
                    cursor: "pointer",
                });
            }
            if (dDD !== "") {
                const path = SVG.addChild(featureGroup, "path", {
                    d: dDD,
                    fill: "black",
                    cursor: "pointer",
                });
            }
            if (d11 !== "") {
                const path = SVG.addChild(featureGroup, "path", {
                    d: d11,
                    fill: "red",
                    cursor: "pointer",
                });
            }
            if (d01 !== "") {
                const path = SVG.addChild(featureGroup, "path", {
                    d: d01,
                    fill: "orange",
                    cursor: "pointer",
                });
            }

            let lastSampleIndex = 0;
            $(featureGroup).qtip({
                content: { text: `${tooltipText}<br>${samplesCount} samples`, title: tooltipTitle },
                position: { target: "mouse", adjust: { x: 25, y: 15 } },
                style: { width: true, classes: `${this.toolTipfontClass} ui-tooltip ui-tooltip-shadow` },
                show: { delay: 300 },
                hide: { delay: 300 },
            });

            $(featureGroup).mousemove((event) => {
                const sampleIndex = parseInt(event.offsetY / yi2);
                if (sampleIndex !== lastSampleIndex) {
                    console.log(sampleIndex);
                    samplesCount = 0;
                    let sampleName = "";
                    let found = false;
                    for (const i in feature.studies) {
                        for (const j in feature.studies[i].samplesData) { // better search it up than storing it? memory could be an issue.
                            if (sampleIndex === samplesCount) {
                                found = true;
                                sampleName = j;
                            }
                            samplesCount++;
                        }
                    }
                    $(featureGroup).qtip("option", "content.text", `${tooltipText}<br>${sampleName}`);
                }
                lastSampleIndex = sampleIndex;
            });
        }
        console.timeEnd("Variant Extended GT Renderer");
    }

    _renderCompactVariants(features, args) {
        console.time("Variant Compact Renderer");

        const _this = this;
        const svgGroup = SVG.create("g");
        for (let i = 0; i < features.length; i++) {
            const feature = features[i];

            if ("featureType" in feature) {
                Object.assign(this, FEATURE_TYPES[feature.featureType]);
            }
            if ("featureClass" in feature) {
                Object.assign(this, FEATURE_TYPES[feature.featureClass]);
            }

            // Temporal fix for clinical
            if (args.featureType === "clinical") {
                if ("clinvarSet" in feature) {
                    Object.assign(this, FEATURE_TYPES.Clinvar);
                } else if ("mutationID" in feature) {
                    Object.assign(this, FEATURE_TYPES.Cosmic);
                } else {
                    Object.assign(this, FEATURE_TYPES.GWAS);
                }
            }

            // get feature render configuration
            const color = _.isFunction(this.color) ? this.color(feature) : this.color;
            const strokeColor = _.isFunction(this.strokeColor) ? this.color(feature) : this.strokeColor;
            const label = _.isFunction(this.label) ? this.label(feature) : this.label;
            const height = _.isFunction(this.height) ? this.height(feature) : this.height;
            const tooltipTitle = _.isFunction(this.tooltipTitle) ? this.tooltipTitle(feature) : this.tooltipTitle;
            const tooltipText = _.isFunction(this.tooltipText) ? this.tooltipText(feature) : this.tooltipText;
            const infoWidgetId = _.isFunction(this.infoWidgetId) ? this.infoWidgetId(feature) : this.infoWidgetId;

            // get feature genomic information
            const start = feature.start;
            const end = feature.end;
            let length = (end - start) + 1;

            // check genomic length
            length = (length < 0) ? Math.abs(length) : length;
            length = (length === 0) ? 1 : length;

            // transform to pixel position
            const width = length * args.pixelBase;

            const svgLabelWidth = label.length * 6.4;

            // calculate x to draw svg rect
            const x = this.getFeatureX(start, args);

            let maxWidth = Math.max(width, 2);
            let textHeight = 0;
            if (args.maxLabelRegionSize > args.regionSize) {
                textHeight = 9;
                maxWidth = Math.max(width, svgLabelWidth);
            }

            let rowY = 0;
            let textY = textHeight + height;
            const rowHeight = textHeight + height + 2;

            while (true) {
                if (!(rowY in args.renderedArea)) {
                    args.renderedArea[rowY] = new FeatureBinarySearchTree();
                }
                const foundArea = args.renderedArea[rowY].add({ start: x, end: x + maxWidth - 1 });

                if (foundArea) {
                    const featureGroup = SVG.addChild(svgGroup, "g", { feature_id: feature.id });
                    const rect = SVG.addChild(featureGroup, "rect", {
                        x,
                        y: rowY,
                        width,
                        height,
                        stroke: strokeColor,
                        "stroke-width": 1,
                        "stroke-opacity": 0.7,
                        fill: color,
                        cursor: "pointer",
                    });

                    if (args.maxLabelRegionSize > args.regionSize) {
                        const text = SVG.addChild(featureGroup, "text", {
                            i,
                            x,
                            y: textY,
                            "font-weight": 400,
                            opacity: null,
                            fill: "black",
                            cursor: "pointer",
                            class: this.fontClass,
                        });
                        text.textContent = label;
                    }

                    if ("tooltipText" in this) {
                        $(featureGroup).qtip({
                            content: { text: tooltipText, title: tooltipTitle },
                            //                        position: {target: "mouse", adjust: {x: 15, y: 0}, effect: false},
                            position: { viewport: $(window), target: "mouse", adjust: { x: 25, y: 15 } },
                            style: { width: true, classes: `${this.toolTipfontClass} ui-tooltip ui-tooltip-shadow` },
                            show: { delay: 300 },
                            hide: { delay: 300 },
                        });
                    }

                    $(featureGroup).mouseover((event) => {
                        _this.trigger("feature:mouseover", {
                            query: feature[infoWidgetId],
                            feature,
                            featureType: feature.featureType,
                            mouseoverEvent: event,
                        });
                    });

                    $(featureGroup).click((event) => {
                        _this.trigger("feature:click", {
                            query: feature[infoWidgetId],
                            feature,
                            featureType: feature.featureType,
                            clickEvent: event,
                        });
                    });
                    break;
                }
                rowY += rowHeight;
                textY += rowHeight;
            }
        }
        args.svgCanvasFeatures.appendChild(svgGroup);
        console.timeEnd("Variant Compact Renderer");
    }

    getDefaultConfig() {
        return {
            infoWidgetId: "id",
            color: "#8BC34A",
            strokeColor: "#555",
            height: 10,
            histogramColor: "#58f3f0",
            label(f) {
                let tokens = [];
                if (f.id) {
                    tokens.push(f.id);
                }
                if (f.name) {
                    tokens.push(f.name);
                }
                return tokens.join(" - ");
            },
            tooltipTitle(f) {
                let tokens = [];
                if (f.featureType) {
                    tokens.push(f.featureType);
                }
                if (f.id) {
                    tokens.push(f.id);
                }
                if (f.name) {
                    tokens.push(f.name);
                }
                return tokens.join(" - ");
            },
            tooltipText(f) {
                let strand = (f.strand !== null) ? f.strand : "NA";
                let region = `start-end:&nbsp;<span style="font-weight: bold">${f.start}-${f.end} (${strand})</span><br>` +
                        `length:&nbsp;<span style="font-weight: bold; color:#005fdb">${(f.end - f.start + 1).toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")}</span><br>`;

                let s = "";
                for (let key in f) {
                    if (key === "start" || key === "end" || key === "id" || key === "name" || key === "length") {
                        continue;
                    }
                    if (_.isNumber(f[key]) || _.isString(f[key])) {
                        s += `${key}:&nbsp;<span style="font-weight: bold">${f[key]}</span><br>`;
                    }
                }
                return `${region} ${s}`;
            }
        };
    }
}
class FeatureTrack {
    constructor(args) {
        this.id = Utils.genId("track");
        this.dataAdapter;
        this.renderer;
        this.histogramRendererName = "HistogramRenderer";
        this.resizable = true;
        this.autoHeight = false;
        this.targetId;
        this.title;
        this.minHistogramRegionSize = 300000000;
        this.maxLabelRegionSize = 300000000;
        this.width = 200;
        this.height = 100;
        this.visibleRegionSize;
        this.visible = true;
        this.contentVisible = true;
        this.closable = false;
        this.showSettings = false;
        this.fontClass = "ocb-font-roboto ocb-font-size-14";
        this.externalLink = "";
        this.autoRender = false;
        this.exclude;

        Object.assign(this, args);
        if (this.renderer != null) {
            this.renderer.track = this;
        }

        this.pixelBase;
        this.svgCanvasWidth = 500000;
        this.pixelPosition = this.svgCanvasWidth / 2;
        this.svgCanvasOffset;

        this.status;
        this.histogram;
        this.histogramLogarithm;
        this.histogramMax;
        this.interval;

        this.svgCanvasLeftLimit;
        this.svgCanvasRightLimit;


        this.invalidZoomText;


        this.renderedArea = {}; //used for renders to store binary trees
        this.chunksDisplayed = {}; //used to avoid painting multiple times features contained in more than 1 chunk

        if ("handlers" in this) {
            for (let eventName in this.handlers) {
                this.on(eventName, this.handlers[eventName]);
            }
        }

        this.rendered = false;
        if (this.autoRender) {
            this.render();
        }

        Object.assign(this, Backbone.Events);

        //save default render reference;
        // this.defaultRenderer = this.renderer;
        // this.renderer = this.renderer;

        //this.histogramRenderer = new window[this.histogramRendererName](args);
        this.histogramRenderer = new HistogramRenderer(args);
        this.dataType = "features";

        this.featureType = "Feature"; // This only have the old class feature track
        // this.resource = this.dataAdapter.resource;// This only have the old class feature track
        // this.species = this.dataAdapter.species;// This only have the old class feature track
    }

    get(attr) {
        return this[attr];
    }

    set(attr, value) {
        this[attr] = value;
    }

    hide() {
        this.visible = false;
        this.div.classList.add("hidden");
    }

    show() {
        this.visible = true;
        this.div.classList.remove("hidden");
        this.updateHeight();
    }

    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    remove() {
        $(this.div).remove();
    }

    hideContent() {
        this.contentVisible = false;
        this.contentDiv.classList.add("hidden");
        this.resizeDiv.classList.add("hidden");

        this.iToggleEl.classList.remove("fa-minus");
        this.iToggleEl.classList.add("fa-plus");
    }

    showContent() {
        this.contentVisible = true;
        this.contentDiv.classList.remove("hidden");
        this.resizeDiv.classList.remove("hidden");

        this.iToggleEl.classList.remove("fa-plus");
        this.iToggleEl.classList.add("fa-minus");
        this.updateHeight();
    }

    toggleContent() {
        if (this.contentVisible) {
            this.hideContent();
        } else {
            this.showContent();
        }
    }

    settingsContent() {
        this.trigger("track:settings", { sender: this });
    }

    close() {
        this.trigger("track:close", { sender: this });
    }

    up() {
        this.trigger("track:up", { sender: this });
    }

    down() {
        this.trigger("track:down", { sender: this });
    }

    setSpecies(species) {
        this.species = species;
        this.dataAdapter.setSpecies(this.species);
    }

    enableAutoHeight() {
        console.log("enable autoHeigth");
        this.autoHeight = true;
        this.updateHeight();
    }

    disableAutoHeight() {
        console.log("disable autoHeigth");
        this.autoHeight = false;
        this.updateHeight();
    }

    toggleAutoHeight(bool) {
        if (bool === true) {
            this.enableAutoHeight();
            return;
        } else if (bool === false) {
            this.disableAutoHeight();
            return;
        }
        if (this.autoHeight === true) {
            this.disableAutoHeight();
            return;
        } else if (this.autoHeight === false) {
            this.enableAutoHeight();
            return;
        }
    }

    setTitle(title) {
        $(this.titleText).html(title);
    }

    setLoading(bool) {
        if (bool) {
            this.status = "rendering";
            $(this.loadingEl).html('&nbsp; &nbsp;<i class="fa fa-spinner fa-spin"></i> Loading...</span>');
        } else {
            this.status = "ready";
            $(this.loadingEl).html("");
        }
    }

    updateHistogramParams() {
        if (this.region.length() > this.minHistogramRegionSize) {
            this.histogram = true;
            this.histogramLogarithm = true;
            this.histogramMax = 500;
            this.interval = Math.ceil(10 / this.pixelBase); //server interval limit 512
            $(this.histogramEl).html('&nbsp;<i class="fa fa-signal"></i>');
        } else {
            this.histogram = undefined;
            this.histogramLogarithm = undefined;
            this.histogramMax = undefined;
            this.interval = undefined;
            $(this.histogramEl).html("");
        }
    }
    clean() {
        this._clean();
        while (this.svgCanvasFeatures.firstChild) {
            this.svgCanvasFeatures.removeChild(this.svgCanvasFeatures.firstChild);
        }
    }

    _clean() {
        //Must be called on child clean method
        this.chunksDisplayed = {};
        this.renderedArea = {};
    }

    //updateHeight() {
    //    this._updateHeight();
    //}
    //
    //_updateHeight() {
    //    $(this.contentDiv).css({
    //        'height': this.height + 10
    //    });
    //}

    updateHeight() {
        //this._updateHeight();
        if (this.histogram) {
            this.contentDiv.style.height = `${this.histogramRenderer.histogramHeight + 5}px`;
            this.main.setAttribute("height", this.histogramRenderer.histogramHeight);
            return;
        }

        let renderedHeight = this.height;
        let heightKeys = Object.keys(this.renderedArea);
        heightKeys.sort(function (a, b) {
            return parseInt(b) - parseInt(a);
        });
        if (heightKeys.length > 0) {
            renderedHeight = parseInt(heightKeys[0]) + 30;
        }
        renderedHeight = Math.max(renderedHeight, this.height);
        this.main.setAttribute("height", renderedHeight);

        if (this.resizable) {
            if (this.autoHeight === false) {
                this.contentDiv.style.height = `${this.height + 10}px`;
            } else if (this.autoHeight === true) {
                let x = this.pixelPosition;
                let width = this.width;
                let lastContains = 0;
                for (let i in this.renderedArea) {
                    if (this.renderedArea[i].contains({
                            start: x,
                            end: x + width
                        })) {
                        lastContains = i;
                    }
                }
                let visibleHeight = Math.max(parseInt(lastContains) + 30, this.height);
                this.contentDiv.style.height = `${visibleHeight + 10}px`;
                this.main.setAttribute("height", visibleHeight);
            }
        }
    }

    setWidth(width) {
        this._setWidth(width);
        this.main.setAttribute("width", this.width);
    }

    _setWidth(width) {
        this.width = width;
    }

    initializeDom(targetId) {
        this._initializeDom(targetId);

        this.main = SVG.addChild(this.contentDiv, "svg", {
            "class": "trackSvg",
            "x": 0,
            "y": 0,
            "width": this.width
        });
        this.svgCanvasFeatures = SVG.addChild(this.main, "svg", {
            "class": "features",
            "x": -this.pixelPosition,
            "width": this.svgCanvasWidth
        });
        this.updateHeight();
        this.renderer.init();
    }

    _initializeDom(targetId) {
        let _this = this;
        let div = $(`<div id="${this.id}-div"></div>`)[0];
        div.classList.add("ocb-gv-track");

        let titleBarHtml = `
           <div class="ocb-gv-track-title">
               <div class="ocb-gv-track-title-el">
                    <span class="ocb-gv-track-title-text">${this.title}</span>
                    <span class="ocb-gv-track-title-histogram"></span>
                    <span class="ocb-gv-track-title-toggle"><i class="fa fa-minus"></i></span>
                    <span class="ocb-gv-track-title-down"><i class="fa fa-chevron-down"></i></span>
                    <span class="ocb-gv-track-title-up"><i class="fa fa-chevron-up"></i></span>
        `;

        if (this.showSettings === true) {
            titleBarHtml += '           <span class="ocb-gv-track-title-settings"><i class="fa fa-cog"></i></span>';
        }

        if (this.closable === true) {
            titleBarHtml += '           <span class="ocb-gv-track-title-close"><i class="fa fa-times"></i></span>';
        }

        if (this.externalLink !== "") {
            titleBarHtml += '           <span class="ocb-gv-track-title-external-link"><i class="fa fa-external-link"></i></span>';
        }

        titleBarHtml += `            <span class="ocb-gv-track-title-loading"></span>
                </div>
            </div>
        `;

        let titleBardiv = $(titleBarHtml)[0];

        if (typeof this.title === "undefined") {
            $(titleBardiv).addClass("hidden");
        }

        let titlediv = titleBardiv.querySelector(".ocb-gv-track-title");
        this.titleEl = titleBardiv.querySelector(".ocb-gv-track-title-el");

        this.titleText = titleBardiv.querySelector(".ocb-gv-track-title-text");
        this.histogramEl = titleBardiv.querySelector(".ocb-gv-track-title-histogram");
        this.toggleEl = titleBardiv.querySelector(".ocb-gv-track-title-toggle");
        this.iToggleEl = this.toggleEl.querySelector("i");
        this.loadingEl = titleBardiv.querySelector(".ocb-gv-track-title-loading");
        this.settingsEl = titleBardiv.querySelector(".ocb-gv-track-title-settings");
        this.closeEl = titleBardiv.querySelector(".ocb-gv-track-title-close");
        this.upEl = titleBardiv.querySelector(".ocb-gv-track-title-up");
        this.downEl = titleBardiv.querySelector(".ocb-gv-track-title-down");
        this.externalLinkEl = titleBardiv.querySelector(".ocb-gv-track-title-external-link");

        let contentDiv = $(`<div id="${this.id}-svgdiv"></div>`)[0];
        $(contentDiv).css({
            "position": "relative",
            "box-sizing": "boder-box",
            "z-index": 3,
            "height": this.height,
            "overflow-y": (this.resizable) ? "auto" : "hidden",
            "overflow-x": "hidden"
        });

        let resizediv = $(`<div id="${this.id}-resizediv" class="ocb-track-resize"></div>`)[0];

        $(targetId).addClass("unselectable");
        $(targetId).append(div);
        $(div).append(titleBardiv);
        $(div).append(contentDiv);
        $(div).append(resizediv);


        /** title div **/
        $(titleBardiv).css({
            "padding": "4px"
        }).on("dblclick", function(e) {
            e.stopPropagation();
        });

        $(this.toggleEl).click(function(e) {
            _this.toggleContent();
        });
        $(this.settingsEl).click(function(e) {
            _this.settingsContent();
        });
        $(this.closeEl).click(function(e) {
            _this.close();
        });
        $(this.upEl).click(function(e) {
            _this.up();
        });
        $(this.downEl).click(function(e) {
            _this.down();
        });
        $(this.externalLinkEl).click(function(e) {
            window.open(_this.externalLink);
        });

        if (this.resizable) {
            $(resizediv).mousedown(function(event) {
                $("html").addClass("unselectable");
                event.stopPropagation();
                let downY = event.clientY;
                $("html").bind("mousemove.genomeViewer", function(event) {
                    let despY = (event.clientY - downY);
                    let actualHeight = $(contentDiv).outerHeight();
                    let newHeight = actualHeight + despY;
                    if (newHeight > 0) {
                        _this.height = newHeight;
                        $(contentDiv).css({
                            height: _this.height
                        });
                    }
                    downY = event.clientY;
                    //                    _this.autoHeight = false;
                });
            });
            $("html").bind("mouseup.genomeViewer", function(event) {
                $("html").removeClass("unselectable");
                $("html").off("mousemove.genomeViewer");
            });
            $(contentDiv).closest(".trackListPanels").mouseup(function(event) {
                _this.updateHeight();
            });
        }

        this.div = div;
        this.contentDiv = contentDiv;
        this.titlediv = titlediv;
        this.resizeDiv = resizediv;
        this.rendered = true;
        this.status = "ready";
    }

    _drawHistogramLegend() {
        let histogramHeight = this.histogramRenderer.histogramHeight;
        let multiplier = this.histogramRenderer.multiplier;

        this.histogramGroup = SVG.addChild(this.svgGroup, "g", {
            "class": "histogramGroup",
            "visibility": "hidden"
        });
        let text = SVG.addChild(this.histogramGroup, "text", {
            "x": 21,
            "y": histogramHeight + 4,
            "font-size": 12,
            "opacity": "0.9",
            "fill": "orangered",
            "class": this.fontClass
        });
        text.textContent = "0-";
        text = SVG.addChild(this.histogramGroup, "text", {
            "x": 14,
            "y": histogramHeight + 4 - (Math.log(10) * multiplier),
            "font-size": 12,
            "opacity": "0.9",
            "fill": "orangered",
            "class": this.fontClass
        });
        text.textContent = "10-";
        text = SVG.addChild(this.histogramGroup, "text", {
            "x": 7,
            "y": histogramHeight + 4 - (Math.log(100) * multiplier),
            "font-size": 12,
            "opacity": "0.9",
            "fill": "orangered",
            "class": this.fontClass
        });
        text.textContent = "100-";
        text = SVG.addChild(this.histogramGroup, "text", {
            "x": 0,
            "y": histogramHeight + 4 - (Math.log(1000) * multiplier),
            "font-size": 12,
            "opacity": "0.9",
            "fill": "orangered",
            "class": this.fontClass
        });
        text.textContent = "1000-";
    }

    render(targetId) {
        this.initializeDom(targetId);

        this._setCanvasConfig();
    }

    _setCanvasConfig() {
        this.svgCanvasOffset = (this.width * 3 / 2) / this.pixelBase;
        this.svgCanvasLeftLimit = this.region.start - this.svgCanvasOffset * 2;
        this.svgCanvasRightLimit = this.region.start + this.svgCanvasOffset * 2;
    }

    getDataHandler(event) {
        console.time("Total FeatureTrack -> getDataHandler " + event.sender.category);

        console.time("Chunks() FeatureTrack -> getDataHandler " + event.sender.category);
        let renderer;
        let features;
        if (event.dataType !== "histogram") {
            renderer = this.renderer;
            features = this.getFeaturesToRenderByChunk(event);
        } else {
            renderer = this.histogramRenderer;
            features = event.items;
        }
        console.timeEnd("Chunks() FeatureTrack -> getDataHandler " + event.sender.category);

        console.time("render() FeatureTrack -> getDataHandler " + event.sender.category);
        renderer.render(features, {
            cacheItems: event.items,
            svgCanvasFeatures: this.svgCanvasFeatures,
            featureTypes: this.featureTypes,
            renderedArea: this.renderedArea,
            pixelBase: this.pixelBase,
            position: this.region.center(),
            regionSize: this.region.length(),
            maxLabelRegionSize: this.maxLabelRegionSize,
            width: this.width,
            pixelPosition: this.pixelPosition,
            resource: this.resource,
            species: this.species,
            featureType: this.featureType
        });
        console.timeEnd("render() FeatureTrack -> getDataHandler " + event.sender.category);

        this.updateHeight();
        console.timeEnd("Total FeatureTrack -> getDataHandler " + event.sender.category);
    }

    draw(adapter, renderer) {

        if (typeof adapter === "undefined" || adapter === null) {
            adapter = this.dataAdapter;
        }

        //if (renderer == null){
        //    renderer = this.renderer;
        //}

        this.clean();
        this._setCanvasConfig();

        this.updateHistogramParams();

        this.dataType = "features";
        if (this.histogram) {
            this.dataType = "histogram";
        }

        let _this = this;
        if (typeof this.visibleRegionSize === "undefined" || this.region.length() < this.visibleRegionSize) {
            this.setLoading(true);

            let region = new Region({chromosome: this.region.chromosome,
                start: this.region.start - this.svgCanvasOffset * 2,
                end: this.region.end + this.svgCanvasOffset * 2
            });

            // let params = {
            //     histogram: this.histogram,
            //     histogramLogarithm: this.histogramLogarithm,
            //     histogramMax: this.histogramMax,
            //     interval: this.interval,
            //     exclude: this.exclude
            // };
            if(UtilsNew.isUndefined(adapter.params)){
                adapter.params = {};
            }
            let params = Object.assign(adapter.params, {
                histogram: this.histogram,
                histogramLogarithm: this.histogramLogarithm,
                histogramMax: this.histogramMax,
                interval: this.interval
            });

            console.time("SuperTotal FeatureTrack -> getDataHandler")
            adapter.getData({dataType: this.dataType, region: region, params: params})
                .then(function (response) {
                    _this.getDataHandler(response);
                    _this.setLoading(false);
                })
                .catch(function(reason) {
                    console.log("Feature Track draw error: " + reason);
                });
            console.timeEnd("SuperTotal FeatureTrack -> getDataHandler");
        } else {
            //        this.invalidZoomText.setAttribute("visibility", "visible");
        }
        this.updateHeight();
    }

    getFeaturesToRenderByChunk(response, filters) {
        //Returns an array avoiding already drawn features in this.chunksDisplayed
        let getChunkId = function(position) {
            return Math.floor(position / response.chunkSize);
        };
        let getChunkKey = function(chromosome, chunkId) {
            return `${chromosome}:${chunkId}_${response.dataType}_${response.chunkSize}`;
        };

        let chunks = response.items;

        let feature, displayed, featureFirstChunk, featureLastChunk, features = [];
        for (let i = 0, leni = chunks.length; i < leni; i++) {
            if (this.chunksDisplayed[chunks[i].chunkKey] !== true) { //check if any chunk is already displayed and skip it
                for (let j = 0, lenj = chunks[i].value.length; j < lenj; j++) {
                    feature = chunks[i].value[j];

                    //check if any feature has been already displayed by another chunk
                    displayed = false;
                    featureFirstChunk = getChunkId(feature.start);
                    featureLastChunk = getChunkId(feature.end);
                    for (let chunkId = featureFirstChunk; chunkId <= featureLastChunk; chunkId++) {
                        let chunkKey = getChunkKey(feature.chromosome, chunkId);
                        if (this.chunksDisplayed[chunkKey] === true) {
                            displayed = true;
                            break;
                        }
                    }
                    if (!displayed) {
                        features.push(feature);
                    }
                }
                this.chunksDisplayed[chunks[i].chunkKey] = true;
            }
        }
        return features;
    }

    move(disp) {
        let _this = this;

        this.dataType = "features";
        if (this.histogram) {
            this.dataType = "histogram";
        }

        _this.region.center();
        let pixelDisplacement = disp * _this.pixelBase;
        this.pixelPosition -= pixelDisplacement;

        //parseFloat important
        let move = parseFloat(this.svgCanvasFeatures.getAttribute("x")) + pixelDisplacement;
        this.svgCanvasFeatures.setAttribute("x", move);

        let virtualStart = parseInt(this.region.start - this.svgCanvasOffset);
        let virtualEnd = parseInt(this.region.end + this.svgCanvasOffset);

        if (typeof this.visibleRegionSize === "undefined" || this.region.length() < this.visibleRegionSize) {

            if (disp > 0 && virtualStart < this.svgCanvasLeftLimit) {
                this.dataAdapter.getData({
                    dataType: this.dataType,
                    region: new Region({
                        chromosome: _this.region.chromosome,
                        start: parseInt(this.svgCanvasLeftLimit - this.svgCanvasOffset),
                        end: this.svgCanvasLeftLimit
                    }),
                    params: {
                        histogram: this.histogram,
                        histogramLogarithm: this.histogramLogarithm,
                        histogramMax: this.histogramMax,
                        interval: this.interval
                    }
                })
                .then(function (response) {
                    _this.getDataHandler(response);
                })
                .catch(function(reason) {
                    console.log("Feature Track move error: " + reason)
                });
                this.svgCanvasLeftLimit = parseInt(this.svgCanvasLeftLimit - this.svgCanvasOffset);
            }

            if (disp < 0 && virtualEnd > this.svgCanvasRightLimit) {
                this.dataAdapter.getData({
                    dataType: this.dataType,
                    region: new Region({
                        chromosome: _this.region.chromosome,
                        start: this.svgCanvasRightLimit,
                        end: parseInt(this.svgCanvasRightLimit + this.svgCanvasOffset)
                    }),
                    params: {
                        histogram: this.histogram,
                        histogramLogarithm: this.histogramLogarithm,
                        histogramMax: this.histogramMax,
                        interval: this.interval
                    }
                })
                .then(function (response) {
                    _this.getDataHandler(response);
                })
                .catch(function(reason) {
                    console.log("Feature Track move error: " + reason)
                });
                this.svgCanvasRightLimit = parseInt(this.svgCanvasRightLimit + this.svgCanvasOffset);
            }
        }

        if (this.autoHeight === true) {
            this.updateHeight();
        }
    }
}
class GeneTrack extends FeatureTrack {

    constructor(args) {
        super(args);

        this.DEFAULT_EXCLUDE = "transcripts.tfbs,transcripts.xrefs,transcripts.cDnaSequence,transcripts.exons.sequence,annotation";

        // set default values
        this.minTranscriptRegionSize = 200000;

        // set user args
        Object.assign(this, args);

        // init dataAdapter and renderer
        this.histogramRenderer = new HistogramRenderer(args);
        this._init();

        // These variables must be fixed in this GeneTrack
        this.dataType = "features";
        this.resource = this.dataAdapter.resource;
        this.species = this.dataAdapter.species;
    }

    _init() {
        // set CellBase adapter as default
        if (typeof this.dataAdapter === "undefined") {
            if (typeof this.cellbase !== "undefined" && this.cellbase !== null) {
                let cellBaseConfig = new CellBaseClientConfig(this.cellbase.host, this.cellbase.version, this.cellbase.species);
                cellBaseConfig.cache.active = false;
                this.dataAdapter = new CellBaseAdapter(new CellBaseClient(cellBaseConfig), "genomic", "region", "gene", {},
                    { chunkSize: 100000 });
            }
        }

        // set a default geneRenderer
        if (typeof this.renderer === "undefined") {
            this.renderer = new GeneRenderer({});
        }
    }

    getDataHandler(event) {
        if (typeof event !== "undefined") {

            let renderer;
            let features;
            if (event.dataType !== "histogram") {
                renderer = this.renderer;
                features = this.getFeaturesToRenderByChunk(event);
            } else {
                renderer = this.histogramRenderer;
                features = event.items;
            }

            renderer.render(features, {
                cacheItems: event.items,
                svgCanvasFeatures: this.svgCanvasFeatures,
                renderedArea: this.renderedArea,
                pixelBase: this.pixelBase,
                position: this.region.center(),
                regionSize: this.region.length(),
                maxLabelRegionSize: this.maxLabelRegionSize,
                width: this.width,
                pixelPosition: this.pixelPosition

            });

            this.updateHeight();
        }
    }

    draw() {
        if (this.region.length() < this.minTranscriptRegionSize) {
            this.exclude = this.DEFAULT_EXCLUDE;
        } else {
            this.exclude = "transcripts,annotation";
        }

        super.draw(this.dataAdapter, this.renderer);
    }

    move(disp) {
        let _this = this;

        this.dataType = "features";

        //if (!_.isUndefined(this.exclude)) {
        //    this.dataType = "features" + this.exclude;
        //}

        if (this.histogram) {
            this.dataType = "histogram";
        }

        //    trackSvg.position = _this.region.center();
        _this.region.center();
        let pixelDisplacement = disp * _this.pixelBase;
        this.pixelPosition -= pixelDisplacement;

        //parseFloat important
        let move = parseFloat(this.svgCanvasFeatures.getAttribute("x")) + pixelDisplacement;
        this.svgCanvasFeatures.setAttribute("x", move);

        let virtualStart = parseInt(this.region.start - this.svgCanvasOffset);
        let virtualEnd = parseInt(this.region.end + this.svgCanvasOffset);
        // check if track is visible in this zoom

        if (typeof this.visibleRegionSize === "undefined" || this.region.length() < this.visibleRegionSize) {

            if (disp > 0 && virtualStart < this.svgCanvasLeftLimit) {
                //          left
                this.dataAdapter.getData({
                    dataType: this.dataType,
                    region: new Region({
                        chromosome: _this.region.chromosome,
                        start: parseInt(this.svgCanvasLeftLimit - this.svgCanvasOffset),
                        end: this.svgCanvasLeftLimit
                    }),
                    params: {
                        histogram: this.histogram,
                        histogramLogarithm: this.histogramLogarithm,
                        histogramMax: this.histogramMax,
                        interval: this.interval,
                        exclude: this.exclude
                    },
                    //done: function (event) {
                    //    _this.getDataHandler(event);
                    //}
                }).then(function (response) {
                    _this.getDataHandler(response);
                }).catch(function(reason) {
                    console.log(`Gene Track move error: ${reason}`);
                });
                this.svgCanvasLeftLimit = parseInt(this.svgCanvasLeftLimit - this.svgCanvasOffset);
            }

            if (disp < 0 && virtualEnd > this.svgCanvasRightLimit) {
                //          right
                this.dataAdapter.getData({
                    dataType: this.dataType,
                    region: new Region({
                        chromosome: _this.region.chromosome,
                        start: this.svgCanvasRightLimit,
                        end: parseInt(this.svgCanvasRightLimit + this.svgCanvasOffset)
                    }),
                    params: {
                        histogram: this.histogram,
                        histogramLogarithm: this.histogramLogarithm,
                        histogramMax: this.histogramMax,
                        interval: this.interval,
                        exclude: this.exclude
                    }
                    //},
                    //done: function (event) {
                    //    _this.getDataHandler(event);
                    //}
                }).then(function (response) {
                    _this.getDataHandler(response);
                }).catch(function(reason) {
                    console.log(`Gene Track move error: ${reason}`);
                });
                this.svgCanvasRightLimit = parseInt(this.svgCanvasRightLimit + this.svgCanvasOffset);
            }
        }

        if (this.autoHeight === true) {
            this.updateHeight();
        }
    }

}
class AlignmentTrack extends FeatureTrack {

    constructor(args) {
        super(args);

        //set default args
        this.retrievedAlignments = null;
        this.retrievedChunkIds = new Set();

        this.config = {
            display: {
                asPairs: true,
                minMapQ: 50, // Reads with a mapping quality under 20 will have a transparency
            },
            filters: {
                properlyPaired: false,
                skipUnmapped: false,
                skipDuplicated: false,
                contained: false,
                minMapQ: -1,
                maxNM: -1,
                maxNH: -1
            }
        };

        // set user args
        Object.assign(this, args);

        this.showSettings = true;

        this._init();

        this.on("track:settings", function(event) {
            this.showModalSettings(event.sender);
        });
    }

    _init() {
        // Set OpenCGA adapter as default.
        // OpenCGA Client constructor(client, category, subcategory, resource, params = {}, options = {}, handlers = {}) {
        if (UtilsNew.isUndefinedOrNull(this.dataAdapter)) {
            if (UtilsNew.isNotUndefinedOrNull(this.opencga)) {
                if (UtilsNew.isNotUndefinedOrNull(this.opencga.client)) {
                    this.dataAdapter = new OpencgaAdapter(this.opencga.client, "analysis/alignment", "", "query", {
                        study: this.opencga.study,
                        fileId: this.opencga.file
                    }, {
                        chunkSize: 5000,
                    });
                }
            } else {
                console.error("No 'dataAdapter' or 'opencga' object provided");
            }
        }

        // Set FeatureRenderer as default
        if (UtilsNew.isUndefinedOrNull(this.renderer)) {
            let customConfig = {};
            if (UtilsNew.isNotUndefinedOrNull(this.opencga)) {
                customConfig = Object.assign(customConfig, this.opencga.config);
            }
            this.renderer = new AlignmentRenderer(
                { config: customConfig }
            );
        }
        this.renderer.track = this;

    }

    initializeDom(targetId) {
        this._initializeDom(targetId);
        this._createModalDiv(targetId);

        this.main = SVG.addChild(this.contentDiv, "svg", {
            "class": "trackSvg",
            "x": 0,
            "y": 0,
            "width": this.width
        });
        this.svgCanvasFeatures = SVG.addChild(this.main, "svg", {
            "class": "features",
            "x": -this.pixelPosition,
            "width": this.svgCanvasWidth
        });
        this.updateHeight();
        this.renderer.init();
    }

    getDataHandler(event) {
        let features = event;
        this.renderedArea = {}; //<- this is only in Alignments
        this.renderer.render(features, {
            config: this.config.display,
            cacheItems: event.items,
            svgCanvasFeatures: this.svgCanvasFeatures,
            featureTypes: this.featureTypes,
            renderedArea: this.renderedArea,
            pixelBase: this.pixelBase,
            position: this.region.center(),
            regionSize: this.region.length(),
            maxLabelRegionSize: this.maxLabelRegionSize,
            width: this.width,
            pixelPosition: this.pixelPosition,
            region: this.region,
            trackListPanel: this.trackListPanel
        });
        this.updateHeight();
    }

    draw() {
        let _this = this;

        this.svgCanvasOffset = (this.width * 3 / 2) / this.pixelBase;
        this.svgCanvasLeftLimit = this.region.start - this.svgCanvasOffset * 2;
        this.svgCanvasRightLimit = this.region.start + this.svgCanvasOffset * 2;

        this.updateHistogramParams();
        this.clean();

        this.dataType = "features";
        if (this.histogram) {
            this.dataType = "histogram";
        }

        if (typeof this.visibleRegionSize === "undefined" || this.region.length() < this.visibleRegionSize) {
            this.setLoading(true);
            this.dataAdapter.getData({
                dataType: this.dataType,
                region: new Region({
                    chromosome: this.region.chromosome,
                    start: this.region.start - this.svgCanvasOffset * 2,
                    end: this.region.end + this.svgCanvasOffset * 2
                }),
                params: {
                    histogram: this.histogram,
                    histogramLogarithm: this.histogramLogarithm,
                    histogramMax: this.histogramMax,
                    interval: this.interval
                }
            })
                .then(function(response) {
                    _this._storeRetrievedAlignments(response);
                    _this.getDataHandler(response);
                    _this.setLoading(false);
                })
                .catch(function(reason){
                    console.log("Alignment Track draw error: " + reason);
                });
            //this.invalidZoomText.setAttribute("visibility", "hidden");
        } else {
            //this.invalidZoomText.setAttribute("visibility", "visible");
        }
        _this.updateHeight();
    }

    move(disp) {
        let _this = this;

        this.dataType = "features";
        if (this.histogram) {
            this.dataType = "histogram";
        }

        _this.region.center();
        let pixelDisplacement = disp * _this.pixelBase;
        this.pixelPosition -= pixelDisplacement;

        let move = parseFloat(this.svgCanvasFeatures.getAttribute("x")) + pixelDisplacement;
        this.svgCanvasFeatures.setAttribute("x", move);

        let virtualStart = parseInt(this.region.start - this.svgCanvasOffset);
        let virtualEnd = parseInt(this.region.end + this.svgCanvasOffset);

        if (typeof this.visibleRegionSize === "undefined" || this.region.length() < this.visibleRegionSize) {

            if (disp > 0 && virtualStart < this.svgCanvasLeftLimit) {
                _this.setLoading(true);
                this.dataAdapter.getData({
                    dataType: this.dataType,
                    region: new Region({
                        chromosome: _this.region.chromosome,
                        start: parseInt(this.svgCanvasLeftLimit - this.svgCanvasOffset - 1),
                        end: this.svgCanvasLeftLimit - 1
                    }),
                    params: {
                        histogram: this.histogram,
                        histogramLogarithm: this.histogramLogarithm,
                        histogramMax: this.histogramMax,
                        interval: this.interval
                    }
                })
                    .then(function(response){
                        _this._addNewAlignments(response, "left");
                        // if(response.dataType === "histogram"){
                        //     _this.getDataHandler(response);
                        // }else {
                        _this.getDataHandler(_this.retrievedAlignments);
                        // }
                        _this.setLoading(false);
                    })
                    .catch(function(reason){
                        console.log("Alignment Track move error: " + reason);

                    });
                this.svgCanvasLeftLimit = parseInt(this.svgCanvasLeftLimit - this.svgCanvasOffset);
            }

            if (disp < 0 && virtualEnd > this.svgCanvasRightLimit) {
                _this.setLoading(true);
                this.dataAdapter.getData({
                    dataType: this.dataType,
                    region: new Region({
                        chromosome: _this.region.chromosome,
                        start: this.svgCanvasRightLimit + 1,
                        end: parseInt(this.svgCanvasRightLimit + this.svgCanvasOffset + 1)
                    }),
                    params: {
                        histogram: this.histogram,
                        histogramLogarithm: this.histogramLogarithm,
                        histogramMax: this.histogramMax,
                        interval: this.interval
                    }
                })
                    .then(function(response){
                        _this._addNewAlignments(response, "right");
                        _this.getDataHandler(_this.retrievedAlignments);
                        _this.setLoading(false);

                    })
                    .catch(function(reason){
                        console.log("Alignment Track move error: " + reason);

                    });
                this.svgCanvasRightLimit = parseInt(this.svgCanvasRightLimit + this.svgCanvasOffset);
            }
        }
    }

    _storeRetrievedAlignments(event) {
        if (event.dataType === "histogram") {
            return;
        }

        this.retrievedAlignments = event;

        // Update real left and right limits
        this.svgCanvasLeftLimit = event.items[0].region.start;
        this.svgCanvasRightLimit = event.items[event.items.length - 1].region.end;

        this.retrievedChunkIds = new Set();
        for (let i = 0; i < event.items.length; i++) {
            this.retrievedChunkIds.add(event.items[i].chunkKey);
        }
    }

    _addNewAlignments(event, position) {
        if (event.dataType === "histogram") {
            return;
        }

        if (position === "right") {
            for (let i = 0; i < event.items.length; i++) {
                if (this.retrievedChunkIds.has(event.items[i].chunkKey)) {
                    // We should not call several times to the webservices asking for regions we already have
                } else {
                    this.retrievedChunkIds.add(event.items[i].chunkKey);
                    this.retrievedAlignments.items.push(event.items[i]);
                }
            }

            // Dispose of far away items from the left
            while (this.retrievedAlignments.items[0].region.end < this.region.start - this.svgCanvasOffset) {
                let chunkKey = this.retrievedAlignments.items[0].chunkKey;
                console.log(`Dispose region ${chunkKey}`);
                this.retrievedChunkIds.delete(chunkKey);
                this.retrievedAlignments.items.splice(0, 1);
            }
        } else { // left
            // this.retrievedAlignments.items.unshift(event.items);
            for (let i = event.items.length - 1; i >= 0; i--) {
                if (this.retrievedChunkIds.has(event.items[i].chunkKey)) {
                    // We should not call several times to the webservices asking for regions we already have
                    // debugger;
                } else {
                    this.retrievedChunkIds.add(event.items[i].chunkKey);
                    this.retrievedAlignments.items.unshift(event.items[i]);
                }
            }

            // Dispose of far away items from the right
            while (this.retrievedAlignments.items[this.retrievedAlignments.items.length - 1].region.start >
            this.region.end + this.svgCanvasOffset) {
                let chunkKey = this.retrievedAlignments.items[this.retrievedAlignments.items.length - 1].chunkKey;
                console.log(`Dispose region ${chunkKey}`);
                this.retrievedChunkIds.delete(chunkKey);
                this.retrievedAlignments.items.splice(this.retrievedAlignments.items.length - 1, 1);
            }

        }

        // Update canvas limits
        this.svgCanvasLeftLimit = this.retrievedAlignments.items[0].region.start;
        this.svgCanvasRightLimit = this.retrievedAlignments.items[this.retrievedAlignments.items.length - 1].region.end;
    }

    _createModalDiv() {

        /*
        * <div class="modal fade">
           <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Modal title</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div class="modal-body">
                <p>Modal body text goes here.</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-primary">Save changes</button>
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
              </div>
            </div>
          </div>
        </div>
        * */
        let div = document.createElement("div");
        div.setAttribute("class", "modal fade");
        div.setAttribute("role", "dialog");

        let modalDialog = document.createElement("div");
        modalDialog.setAttribute("class", "modal-dialog");
        modalDialog.setAttribute("role", "document");
        div.appendChild(modalDialog);

        let modalContent = document.createElement("div");
        modalContent.setAttribute("class", "modal-content");
        modalDialog.appendChild(modalContent);

        let modalBody = document.createElement("div");
        modalBody.setAttribute("class", "modal-body");
        modalBody.appendChild(modalContent);

        this.div.append(div);
        
        this.modalSettings = div;
    }

    showModalSettings(event) {
        debugger
        this.modalSettings.modal('show');
    }
}
class VariantTrack extends FeatureTrack {

    constructor(args) {
        super(args);

        this.DEFAULT_EXCLUDE = "studies,annotation";

        // set user args
        Object.assign(this, args);

        // init dataAdapter and renderer
        this.histogramRenderer = new HistogramRenderer(args);
        this._init();

        this.resource = this.dataAdapter.resource;
        this.species = this.dataAdapter.species;
    }

    _init() {
        // Set OpenCGA adapter as default. OpenCGA Client constructor(client, category, subcategory, resource, params = {}, options = {}, handlers = {}) {
        if (UtilsNew.isUndefinedOrNull(this.dataAdapter)) {
            if (UtilsNew.isNotUndefinedOrNull(this.opencga)) {
                if (UtilsNew.isNotUndefinedOrNull(this.opencga.client)) {
                    this.dataAdapter = new OpencgaAdapter(this.opencga.client, "analysis/variant", "", "query", {
                        studies: this.opencga.studies,
                        exclude: this.DEFAULT_EXCLUDE
                    }, {
                        chunkSize: 10000
                    });
                }

                if (UtilsNew.isNotUndefinedOrNull(this.opencga.samples) && this.opencga.samples.length !== 0) {
                    this.dataAdapter.params.exclude = "studies.files,studies.stats,annotation";
                    this.dataAdapter.params.returnedSamples = this.opencga.samples;
                }
            } else {
                console.error("No 'dataAdapter' or 'opencga' object provided");
            }
        }

        // Set FeatureRenderer as default
        if (UtilsNew.isUndefinedOrNull(this.renderer)) {
            let customConfig = {};
            if (UtilsNew.isNotUndefinedOrNull(this.opencga)) {
                customConfig = Object.assign(customConfig, this.opencga.config);
                customConfig.sampleNames = this.opencga.samples;
            }

            this.renderer = new VariantRenderer(
                { config: customConfig }
            );
        }
        this.renderer.track = this;
    }

    initializeDom(targetId) {
        //TODO Create a button for configuration
        this._initializeDom(targetId);

        this.main = SVG.addChild(this.contentDiv, "svg", {
            "class": "trackSvg",
            "x": 0,
            "y": 0,
            "width": this.width
        });

        this.svgCanvasFeatures = SVG.addChild(this.main, "svg", {
            "class": "features",
            "x": -this.pixelPosition,
            "width": this.svgCanvasWidth
        });

        this.updateHeight();
        this.renderer.init();
    }

    getDataHandler(event) {
        //console.time("Total VariantTrack -> getDataHandler " + event.sender.category);
        //
        //console.time("Chunks() VariantTrack -> getDataHandler " + event.sender.category);
        let renderer;
        let features;
        if (event.dataType !== "histogram" || UtilsNew.isNotUndefinedOrNull(this.renderer.config.sampleNames)) {
            renderer = this.renderer;
            features = this.getFeaturesToRenderByChunk(event);

            console.timeEnd("Chunks() FeatureTrack -> getDataHandler " + event.sender.category);

            console.time("render() FeatureTrack -> getDataHandler " + event.sender.category);
            renderer.render(features, {
                cacheItems: event.items,
                svgCanvasFeatures: this.svgCanvasFeatures,
                featureTypes: this.featureTypes,
                renderedArea: this.renderedArea,
                pixelBase: this.pixelBase,
                position: this.region.center(),
                regionSize: this.region.length(),
                maxLabelRegionSize: this.maxLabelRegionSize,
                width: this.width,
                pixelPosition: this.pixelPosition,
                resource: this.resource,
                species: this.species,
                featureType: this.featureType
            });
            //console.timeEnd("render() VariantTrack -> getDataHandler " + event.sender.category);

            this.updateHeight();
            //console.timeEnd("Total VariantTrack -> getDataHandler " + event.sender.category);

        } else { //(event.dataType == "histogram") {

            renderer = this.histogramRenderer;
            for ( let i = 0; i < event.items.length; i ++){
                features = event.items[i];

                //console.timeEnd("Chunks() VariantTrack -> getDataHandler " + event.sender.category);
                //
                //console.time("render() VariantTrack -> getDataHandler " + event.sender.category);
                renderer.render(features, {
                    cacheItems: features,
                    svgCanvasFeatures: this.svgCanvasFeatures,
                    featureTypes: this.featureTypes,
                    renderedArea: this.renderedArea,
                    pixelBase: this.pixelBase,
                    position: this.region.center(),
                    regionSize: this.region.length(),
                    maxLabelRegionSize: this.maxLabelRegionSize,
                    width: this.width,
                    pixelPosition: this.pixelPosition,
                    resource: this.resource,
                    species: this.species,
                    featureType: this.featureType
                });
                //console.timeEnd("render() VariantTrack -> getDataHandler " + event.sender.category);

                this.updateHeight();
                //console.timeEnd("Total VariantTrack -> getDataHandler " + event.sender.category);
            }
        }

    }

}
class TrackListPanel { //parent is a DOM div element
    constructor(args){
        let _this = this;

        Object.assign(this, Backbone.Events);

        this.cellBaseHost = "http://bioinfo.hpc.cam.ac.uk/cellbase";
        this.cellBaseVersion = "v4";

        //set default args
        this.target;
        this.autoRender = true;
        this.id = Utils.genId("TrackListPanel");
        this.collapsed = false;
        this.collapsible = false;
        this.hidden = false;

        this.tracks = [];
        this.tracksIndex = {};

        this.parentLayout;
        this.mousePosition;
        this.windowSize;

        this.zoomMultiplier = 1;
        this.showRegionOverviewBox = false;


        this.height = 0;

        //set instantiation args, must be last
        Object.assign(this, args);

        //set new region object
        this.region = new Region(this.region);
        this.width -= 18;


        this.status;

        //this region is used to do not modify original region, and will be used by trackSvg
        this.visualRegion = new Region(this.region);

        /********/
        this._setPixelBase();
        /********/

        this.on(this.handlers);

        this.regionChanging = false;

        this.rendered = false;
        if (this.autoRender) {
            this.render();
        }

    }

    show() {
        $(this.div).css({
            display: "block"
        });
        this.hidden = false;
    }

    hide() {
        $(this.div).css({
            display: "none"
        });
        this.hidden = true;
    }
    setVisible(bool) {
        if (bool) {
            this.show();
        } else {
            this.hide();
        }
    }
    setTitle(title) {
        if ("titleDiv" in this) {
            $(this.titleDiv).html(title);
        }
    }
    showContent() {
        $(this.tlHeaderDiv).css({
            display: "block"
        });
        $(this.panelDiv).css({
            display: "block"
        });
        this.collapsed = false;
        $(this.collapseDiv).removeClass("active");
        $(this.collapseDiv).children().first().removeClass("fa-plus");
        $(this.collapseDiv).children().first().addClass("fa-minus");
    }
    hideContent() {
        $(this.tlHeaderDiv).css({
            display: "none"
        });
        $(this.panelDiv).css({
            display: "none"
        });
        this.collapsed = true;
        $(this.collapseDiv).addClass("active");
        $(this.collapseDiv).children().first().removeClass("fa-minus");
        $(this.collapseDiv).children().first().addClass("fa-plus");
    }
    render() {
        let _this = this;

        this.div = document.createElement("div");
        this.div.classList.add("ocb-gv-tracklist");

        this.windowSizeDiv = document.createElement("div");
        this.windowSizeDiv.classList.add("ocb-gv-tracklist-windowsize");

        if ("title" in this && this.title !== "") {

            let titleDiv = document.createElement("div");
            titleDiv.classList.add("ocb-gv-panel-title", "unselectable");

            titleDiv.appendChild(this.windowSizeDiv);

            if (this.collapsible == true) {
                this.collapseDiv = document.createElement("div");
                this.collapseDiv.classList.add("ocb-gv-panel-collapse-control");

                let collapseSpan = document.createElement("span");
                collapseSpan.classList.add("fa", "fa-minus");

                this.collapseDiv.appendChild(collapseSpan);

                $(titleDiv).dblclick(function() {
                    if (_this.collapsed) {
                        _this.showContent();
                    } else {
                        _this.hideContent();
                    }
                });
                $(this.collapseDiv).click(function() {
                    if (_this.collapsed) {
                        _this.showContent();
                    } else {
                        _this.hideContent();
                    }
                });
                titleDiv.appendChild(this.collapseDiv);
            }

            let titleTextDiv = document.createElement("div");
            titleTextDiv.classList.add("ocb-gv-panel-text");
            titleTextDiv.textContent = this.title;
            titleDiv.appendChild(titleTextDiv);


            this.div.appendChild(titleDiv);
        }

        let tlHeaderDiv = $('<div id="tl-header" class="unselectable"></div>')[0];

        let panelDiv = $('<div id="tl-panel"></div>')[0];
        $(panelDiv).css({
            position: "relative",
            width: "100%"
        });


        this.tlTracksDiv = $('<div id="tl-tracks"></div>')[0];
        $(this.tlTracksDiv).css({
            position: "relative",
            "z-index": 3
        });


        $(this.div).append(tlHeaderDiv);
        $(this.div).append(panelDiv);

        $(panelDiv).append(this.tlTracksDiv);


        //Main SVG and its events

        //Position div
        this.positionDiv = document.createElement("div");
        this.positionDiv.classList.add("ocb-gv-tracklist-position");

        this.positionLeftDiv = document.createElement("div");
        this.positionLeftDiv.classList.add("ocb-gv-tracklist-position-left");
        this.positionNucleotidDiv = document.createElement("div");
        this.positionNucleotidDiv.classList.add("ocb-gv-tracklist-position-mid-nt");
        this.positionMidPosDiv = document.createElement("div");
        this.positionMidPosDiv.classList.add("ocb-gv-tracklist-position-mid-pos");
        this.positionMidDiv = document.createElement("div");
        this.positionMidDiv.classList.add("ocb-gv-tracklist-position-mid");
        this.positionRightDiv = document.createElement("div");
        this.positionRightDiv.classList.add("ocb-gv-tracklist-position-right");

        this.positionDiv.appendChild(this.positionLeftDiv);
        this.positionDiv.appendChild(this.positionNucleotidDiv);
        this.positionMidDiv.appendChild(this.positionNucleotidDiv);
        this.positionMidDiv.appendChild(this.positionMidPosDiv);
        this.positionDiv.appendChild(this.positionMidDiv);
        this.positionDiv.appendChild(this.positionRightDiv);
        tlHeaderDiv.appendChild(this.positionDiv);


        let mid = this.width / 2;
        this._setTextPosition();


        this.centerLine = $(`<div id="${this.id}centerLine"></div>`)[0];
        $(panelDiv).append(this.centerLine);
        $(this.centerLine).css({
            "z-index": 2,
            "position": "absolute",
            "left": mid - 1,
            "top": 0,
            "width": Math.floor(this.pixelBase), //this.pixelBase + 1,
            //            'height': '100%',
            "height": "calc(100% - 8px)",
            "opacity": 0.5,
            "border": "1px solid orangered",
            "background-color": "orange"
        });


        this.mouseLine = $(`<div id="${this.id}mouseLine"></div>`)[0];
        $(panelDiv).append(this.mouseLine);
        $(this.mouseLine).css({
            "z-index": 1,
            "position": "absolute",
            "left": -20.5,
            "top": 0,
            "width": Math.floor(this.pixelBase), //this.pixelBase + 2,
            "height": "calc(100% - 8px)",
            "border": "1px solid gray",
            "opacity": 0.7,
            "visibility": "hidden",
            "background-color": "gainsboro"
        });

        //allow selection in trackSvgLayoutOverview


        let selBox = $(`<div id="${this.id}selBox"></div>`)[0];
        $(panelDiv).append(selBox);
        $(selBox).css({
            "z-index": 0,
            "position": "absolute",
            "left": 0,
            "top": 0,
            "height": "100%",
            "border": "2px solid deepskyblue",
            "opacity": 0.5,
            "visibility": "hidden",
            "background-color": "honeydew"
        });

        if (this.showRegionOverviewBox) {
            let regionOverviewBoxLeft = $(`<div id="${this.id}regionOverviewBoxLeft"></div>`)[0];
            let regionOverviewBoxRight = $(`<div id="${this.id}regionOverviewBoxRight"></div>`)[0];
            $(panelDiv).append(regionOverviewBoxLeft);
            $(panelDiv).append(regionOverviewBoxRight);
            let regionOverviewBoxWidth = this.region.length() * this.pixelBase;
            let regionOverviewDarkBoxWidth = (this.width - regionOverviewBoxWidth) / 2;
            $(regionOverviewBoxLeft).css({
                "z-index": 0,
                "position": "absolute",
                "left": 1,
                "top": 0,
                "width": regionOverviewDarkBoxWidth,
                "height": "calc(100% - 8px)",
                //                'border': '1px solid gray',
                "opacity": 0.5,
                //            'visibility': 'hidden',
                "background-color": "lightgray"
            });
            $(regionOverviewBoxRight).css({
                "z-index": 0,
                "position": "absolute",
                "left": (regionOverviewDarkBoxWidth + regionOverviewBoxWidth),
                "top": 0,
                "width": regionOverviewDarkBoxWidth,
                "height": "calc(100% - 8px)",
                "opacity": 0.5,
                "background-color": "lightgray"
            });
            this.regionOverviewBoxLeft = regionOverviewBoxLeft;
            this.regionOverviewBoxRight = regionOverviewBoxRight;
        }


        $(this.div).mousemove(function(event) {
            let centerPosition = _this.region.center();
            let mid = _this.width / 2;
            let mouseLineOffset = _this.pixelBase / 2;
            let offsetX = (event.clientX - _this.tlTracksDiv.getBoundingClientRect().left);

            let cX = offsetX - mouseLineOffset;
            let rcX = (cX / _this.pixelBase) | 0;
            let pos = (rcX * _this.pixelBase) + (mid % _this.pixelBase) - 1;
            $(_this.mouseLine).css({
                "left": pos
            });
            //
            let posOffset = (mid / _this.pixelBase) | 0;
            _this.mousePosition = centerPosition + rcX - posOffset;
            _this.trigger("mousePosition:change", {
                mousePos: _this.mousePosition,
                chromosome: _this.region.chromosome,
                base: _this.getMousePosition(_this.mousePosition)
            });
        });

        $(this.tlTracksDiv).dblclick(function(event) {
            if (!_this.regionChanging) {
                _this.regionChanging = true;
                /**/
                /**/
                /**/
                let halfLength = _this.region.length() / 2;
                let mouseRegion = new Region({
                    chromosome: _this.region.chromosome,
                    start: _this.mousePosition - halfLength,
                    end: _this.mousePosition + halfLength
                });
                _this.trigger("region:change", {
                    region: mouseRegion,
                    sender: _this
                });
                /**/
                /**/
                /**/
                setTimeout(function() {
                    _this.regionChanging = false;
                }, 700);
            }
        });

        let downX, moveX;
        $(this.tlTracksDiv).mousedown(function(event) {
            $("html").addClass("unselectable");
            //                            $('.qtip').qtip('hide').qtip('disable'); // Hide AND disable all tooltips
            $(_this.mouseLine).css({
                "visibility": "hidden"
            });

            let mouseState = event.which;
            if (event.ctrlKey) {
                mouseState = `ctrlKey${event.which}`;
            }
            switch (mouseState) {
                case 1: //Left mouse button pressed
                    $(this).css({
                        "cursor": "move"
                    });
                    downX = event.clientX;
                    let lastX = 0;
                    $(this).mousemove(function(event) {
                        let newX = (downX - event.clientX) / _this.pixelBase | 0; //truncate always towards zero
                        if (newX != lastX) {
                            let disp = lastX - newX;
                            let centerPosition = _this.region.center();
                            let p = centerPosition - disp;
                            if (p > 0) { //avoid 0 and negative positions
                                _this.region.start -= disp;
                                _this.region.end -= disp;
                                _this._setTextPosition();
                                //						_this.onMove.notify(disp);
                                _this.trigger("region:move", {
                                    region: _this.region,
                                    disp: disp,
                                    sender: _this
                                });
                                _this.trigger("trackRegion:move", {
                                    region: _this.region,
                                    disp: disp,
                                    sender: _this
                                });
                                lastX = newX;
                                //_this.setNucleotidPosition(p);
                            }
                        }
                    });

                    break;
                case 2: //Middle mouse button pressed
                case "ctrlKey1": //ctrlKey and left mouse button
                    $(selBox).css({
                        "visibility": "visible"
                    });
                    $(selBox).css({
                        "width": 0
                    });
                    downX = (event.pageX - $(_this.tlTracksDiv).offset().left);
                    $(selBox).css({
                        "left": downX
                    });
                    $(this).mousemove(function(event) {
                        moveX = (event.pageX - $(_this.tlTracksDiv).offset().left);
                        if (moveX < downX) {
                            $(selBox).css({
                                "left": moveX
                            });
                        }
                        $(selBox).css({
                            "width": Math.abs(moveX - downX)
                        });
                    });


                    break;
                case 3: //Right mouse button pressed
                    break;
                default: // other button?
            }


        });

        $(this.tlTracksDiv).mouseup(function(event) {
            $("html").removeClass("unselectable");
            $(this).css({
                "cursor": "default"
            });
            $(_this.mouseLine).css({
                "visibility": "visible"
            });
            $(this).off("mousemove");

            let mouseState = event.which;
            if (event.ctrlKey) {
                mouseState = `ctrlKey${event.which}`;
            }
            switch (mouseState) {
                case 1: //Left mouse button pressed

                    break;
                case 2: //Middle mouse button pressed
                case "ctrlKey1": //ctrlKey and left mouse button
                    $(selBox).css({
                        "visibility": "hidden"
                    });
                    $(this).off("mousemove");
                    if (downX != null && moveX != null) {
                        let ss = downX / _this.pixelBase;
                        let ee = moveX / _this.pixelBase;
                        ss += _this.visualRegion.start;
                        ee += _this.visualRegion.start;
                        _this.region.start = parseInt(Math.min(ss, ee));
                        _this.region.end = parseInt(Math.max(ss, ee));
                        _this.trigger("region:change", {
                            region: _this.region,
                            sender: _this
                        });
                        moveX = null;
                    } else if (downX != null && moveX == null) {
                        let mouseRegion = new Region({
                            chromosome: _this.region.chromosome,
                            start: _this.mousePosition,
                            end: _this.mousePosition
                        });
                        _this.trigger("region:change", {
                            region: mouseRegion,
                            sender: _this
                        });
                    }
                    break;
                case 3: //Right mouse button pressed
                    break;
                default: // other button?
            }

        });

        $(this.tlTracksDiv).mouseleave(function(event) {
            $(this).css({
                "cursor": "default"
            });
            $(_this.mouseLine).css({
                "visibility": "hidden"
            });
            $(this).off("mousemove");
            $("body").off("keydown.genomeViewer");

            $(selBox).css({
                "visibility": "hidden"
            });
            downX = null;
            moveX = null;
        });

        $(this.tlTracksDiv).mouseenter(function(e) {
            //            $('.qtip').qtip('enable'); // To enable them again ;)
            $(_this.mouseLine).css({
                "visibility": "visible"
            });
            $("body").off("keydown.genomeViewer");
            enableKeys();
        });

        var enableKeys = function() {
            //keys
            $("body").bind("keydown.genomeViewer", function(e) {
                let disp = 0;
                switch (e.keyCode) {
                    case 37: //left arrow
                        if (e.ctrlKey) {
                            disp = Math.round(100 / _this.pixelBase);
                        } else {
                            disp = Math.round(10 / _this.pixelBase);
                        }
                        break;
                    case 39: //right arrow
                        if (e.ctrlKey) {
                            disp = Math.round(-100 / _this.pixelBase);
                        } else {
                            disp = Math.round(-10 / _this.pixelBase);
                        }
                        break;
                }
                if (disp != 0) {
                    _this.region.start -= disp;
                    _this.region.end -= disp;
                    _this._setTextPosition();
                    //					_this.onMove.notify(disp);
                    _this.trigger("region:move", {
                        region: _this.region,
                        disp: disp,
                        sender: _this
                    });
                    _this.trigger("trackRegion:move", {
                        region: _this.region,
                        disp: disp,
                        sender: _this
                    });
                }
            });
        };

        this.tlHeaderDiv = tlHeaderDiv;
        this.panelDiv = panelDiv;


        this.setVisible(!this.hidden);
        this.rendered = true;
    }

    setHeight(height) {
        //        this.height=Math.max(height,60);
        //        $(this.tlTracksDiv).css('height',height);
        //        //this.grid.setAttribute("height",height);
        //        //this.grid2.setAttribute("height",height);
        //        $(this.centerLine).css("height",parseInt(height));//25 es el margen donde esta el texto de la posicion
        //        $(this.mouseLine).css("height",parseInt(height));//25 es el margen donde esta el texto de la posicion
    }

    setWidth(width) {
        console.log(`trackListPanel setWidth ------> ${width}`);
        this.width = width - 18;
    }

    highlight(event) {
        this.trigger("trackFeature:highlight", event);
    }


    moveRegion(event) {
        this.region.load(event.region);
        this.visualRegion.load(event.region);
        this._setTextPosition();
        this.trigger("trackRegion:move", event);
    }

    setSpecies(species) {
        this.species = species;
        //        this.trigger('trackSpecies:change', {species: species, sender: this});

        for (let i = 0; i < this.tracks.length; i++) {
            let track = this.tracks[i];
            track.setSpecies(this.species);

        }
    }

    setRegion(region) { //item.chromosome, item.position, item.species
        console.log(`trackListPanel setRegion region ------> ${region}`);
        console.log(`trackListPanel setRegion width ------> ${this.width}`);
        let _this = this;
        let mid = this.width / 2;
        this.region.load(region);
        this.visualRegion.load(region);
        this._setPixelBase();
        //get pixelbase by Region


        $(this.centerLine).css({
            "left": mid - 1,
            "width": this.pixelBase
        });
        $(this.mouseLine).css({
            "width": this.pixelBase
        });

        this._setTextPosition();

        if (this.showRegionOverviewBox) {
            let regionOverviewBoxWidth = this.region.length() * this.pixelBase;
            let regionOverviewDarkBoxWidth = (this.width - regionOverviewBoxWidth) / 2;
            $(this.regionOverviewBoxLeft).css({
                "width": regionOverviewDarkBoxWidth
            });
            $(this.regionOverviewBoxRight).css({
                "left": (regionOverviewDarkBoxWidth + regionOverviewBoxWidth),
                "width": regionOverviewDarkBoxWidth
            });
        }


        this.trigger("window:size", {
            windowSize: this.windowSize
        });


        this.trigger("trackRegion:change", {
            region: this.visualRegion,
            sender: this
        });

        this.positionNucleotidDiv.textContent = ""; //remove base char, will be drawn later if needed

        this.status = "rendering";

    }

    draw() {
        let _this = this;
        this.targetDiv = (this.target instanceof HTMLElement) ? this.target : document.querySelector(`#${this.target}`);
        if (!this.targetDiv) {
            console.log("target not found");
            return;
        }
        this.targetDiv.appendChild(this.div);

        this.trigger("track:draw", {
            sender: this
        });
    }
    _checkAllTrackStatus(status) {
        for (let i = 0; i < this.tracks.length; i++) {
            let track = this.tracks[i];
            if (track.status != status) return false;
        }
        return true;
    }
    checkTracksReady() {
        return this._checkAllTrackStatus("ready");
    }
    addTrack(track) {
        if (_.isArray(track)) {
            for (let i in track) {
                this._addTrack(track[i]);
            }
        } else {
            this._addTrack(track);
        }
    }
    _addTrack(track) {
        if (!this.rendered) {
            console.info(`${this.id} is not rendered yet`);
            return;
        }
        let _this = this;

        if (track == null) {
            return false;
        }
        // Check if already exists
        if (this.containsTrack(track)) {
            return false;
        }


        let length = this.tracks.push(track);
        let insertPosition = length - 1;
        this.tracksIndex[track.id] = insertPosition;

        if (typeof track.dataAdapter.host === "undefined") {
            track.dataAdapter.host = this.cellBaseHost;
        }
        if (typeof track.dataAdapter.version === "undefined") {
            track.dataAdapter.version = this.cellBaseVersion;
        }
        track.set("pixelBase", this.pixelBase);
        track.set("region", this.visualRegion);
        track.set("width", this.width);
        track.setSpecies(this.species);

        track.set("trackListPanel", this);

        // Track must be initialized after we have created
        // de DIV element in order to create the elements in the DOM
        if (!track.rendered) {
            track.render(this.tlTracksDiv);
        }

        // Once tack has been initialize we can call draw() function
        track.draw();


        //trackEvents
        track.set("track:draw", function(event) {
            track.draw();
        });


        track.set("trackRegion:change", function(event) {
          console.log(`trackListPanel trackRegion:change region ------> ${event.region}`);
          console.log(`trackListPanel trackRegion:change width ------> ${_this.width}`);
            track.setWidth(_this.width);
            track.set("pixelBase", _this.pixelBase);
            track.set("region", event.region);
            track.draw();
        });


        track.set("trackRegion:move", function(event) {
            track.set("region", event.region);
            track.set("pixelBase", _this.pixelBase);
            track.move(event.disp);
        });


        track.set("trackFeature:highlight", function(event) {


            let attrName = event.attrName || "feature_id";
            if ("attrValue" in event) {
                event.attrValue = ($.isArray(event.attrValue)) ? event.attrValue : [event.attrValue];
                for (let key in event.attrValue) {
                    let queryStr = `${attrName}~=${event.attrValue[key]}`;
                    let group = $(track.svgdiv).find(`g[${queryStr}]`);
                    $(group).each(function() {
                        let animation = $(this).find("animate");
                        if (animation.length == 0) {
                            animation = SVG.addChild(this, "animate", {
                                "attributeName": "opacity",
                                "attributeType": "XML",
                                "begin": "indefinite",
                                "from": "0.0",
                                "to": "1",
                                "begin": "0s",
                                "dur": "0.5s",
                                "repeatCount": "5"
                            });
                        } else {
                            animation = animation[0];
                        }
                        let y = $(group).find("rect").attr("y");
                        $(track.svgdiv).scrollTop(y);
                        animation.beginElement();
                    });
                }
            }
        });

        track.on("track:close", function(event) {
            _this.removeTrack(event.sender);
        });
        track.on("track:up", function(event) {
            _this._reallocateAbove(event.sender);
        });
        track.on("track:down", function(event) {
            _this._reallocateUnder(event.sender);
        });

        this.on("track:draw", track.get("track:draw"));
        //        this.on('trackSpecies:change', track.get('trackSpecies:change'));
        this.on("trackRegion:change", track.get("trackRegion:change"));
        this.on("trackRegion:move", track.get("trackRegion:move"));
        this.on("trackFeature:highlight", track.get("trackFeature:highlight"));

    }
    toggleAutoHeight(bool) {
        for (let i = 0; i < this.tracks.length; i++) {
            let track = this.tracks[i];
            track.toggleAutoHeight(bool);
        }
    }
    updateHeight() {
        for (let i = 0; i < this.tracks.length; i++) {
            let track = this.tracks[i];
            track.updateHeight(true);
        }
    }

    containsTrack(track) {
        if (typeof this.tracksIndex[track.id] !== "undefined") {
            return true;
        } else {
            return false;
        }
    }
    getTrackIndex(track) {
        return this.tracksIndex[track.id];
    }
    _updateTracksIndex() {
        //update index with correct index after splice
        for (let i = 0; i < this.tracks.length; i++) {
            let track = this.tracks[i];
            this.tracksIndex[track.id] = i;
        }
    }
    refreshTracksDom() {
        for (let i = 0; i < this.tracks.length; i++) {
            let track = this.tracks[i];
            $(track.div).detach();
            $(this.tlTracksDiv).append(track.div);
        }
        this.trigger("tracks:refresh", {
            sender: this
        });
    }
    removeTrack(track) {
        if (!this.containsTrack(track)) {
            return false;
        }
        // first hide the track
        this.hideTrack(track);
        track.remove();

        let index = this.getTrackIndex(track);
        // remove track from list and hash data
        this.tracks.splice(index, 1)[0];
        delete this.tracksIndex[track.id];
        this._updateTracksIndex();

        // delete listeners

        track.off("track:close");
        track.off("track:up");
        track.off("track:down");


        this.off("track:draw", track.get("track:draw"));
        //        this.off('trackSpecies:change', track.get('trackSpecies:change'));
        this.off("trackRegion:change", track.get("trackRegion:change"));
        this.off("trackRegion:move", track.get("trackRegion:move"));
        //this.off('trackWidth:change', track.set('trackWidth:change'));
        this.off("trackFeature:highlight", track.get("trackFeature:highlight"));

        this.refreshTracksDom();
        return track;
    }

    restoreTrack(track, index) {
        if (this.containsTrack((track))) {
            return false;
        }

        this.addTrack(track);
        if (typeof index !== "undefined") {
            this.setTrackIndex(track, index);
        }
        track.show();
        this.refreshTracksDom();
    }


    //This routine is called when track order is modified
    _reallocateAbove(track) {
        if (!this.containsTrack((track))) {
            return false;
        }

        let i = this.getTrackIndex(track);
        console.log(`${i} wants to move up`);
        if (i > 0) {
            let aboveTrack = this.tracks[i - 1];
            let underTrack = this.tracks[i];

            this.tracks[i] = aboveTrack;
            this.tracks[i - 1] = underTrack;
            this.tracksIndex[aboveTrack.id] = i;
            this.tracksIndex[underTrack.id] = i - 1;
            this.refreshTracksDom();
        } else {
            console.log("is at top");
        }
    }

    //This routine is called when track order is modified
    _reallocateUnder(track) {
        if (!this.containsTrack((track))) {
            return false;
        }

        let i = this.getTrackIndex(track);
        console.log(`${i} wants to move down`);
        if (i + 1 < this.tracks.length) {
            let aboveTrack = this.tracks[i];
            let underTrack = this.tracks[i + 1];

            this.tracks[i] = underTrack;
            this.tracks[i + 1] = aboveTrack;
            this.tracksIndex[underTrack.id] = i;
            this.tracksIndex[aboveTrack.id] = i + 1;
            this.refreshTracksDom();
        } else {
            console.log("is at bottom");
        }
    }

    setTrackIndex(track, newIndex) {
        if (!this.containsTrack((track))) {
            return false;
        }

        let oldIndex = this.getTrackIndex(track);

        //remove track from old index
        this.tracks.splice(oldIndex, 1)[0];

        //add track at new Index
        this.tracks.splice(newIndex, 0, track);

        this._updateTracksIndex();

        //update track div positions
        this.refreshTracksDom();
    }
    swapTracks(t1, t2) {
        if (!this.containsTrack((t1))) {
            return false;
        }
        if (!this.containsTrack((t2))) {
            return false;
        }
        let oldIndex1 = this.getTrackIndex(t1);
        let oldIndex2 = this.getTrackIndex(t2);

        this.tracks[oldIndex1] = t2;
        this.tracks[oldIndex2] = t1;
        this.tracksIndex[t1.id] = oldIndex2;
        this.tracksIndex[t2.id] = oldIndex1;
        this.refreshTracksDom();
    }

    scrollToTrack(track) {
        if (!this.containsTrack((track))) {
            return false;
        }

        let y = $(track.div).position().top;
        $(this.tlTracksDiv).scrollTop(y);
    }


    hideTrack(track) {
        if (!this.containsTrack((track))) {
            return false;
        }
        track.hide();
        this.refreshTracksDom();
    }

    showTrack(track) {
        if (!this.containsTrack((track))) {
            return false;
        }
        track.show();
        this.refreshTracksDom();
    }
    _setPixelBase() {
        this.pixelBase = this.width / this.region.length();
        this.pixelBase = this.pixelBase / this.zoomMultiplier;
        this.halfVirtualBase = (this.width * 3 / 2) / this.pixelBase;
    }

    _setTextPosition() {
        let centerPosition = this.region.center();
        let baseLength = parseInt(this.width / this.pixelBase); //for zoom 100
        let aux = Math.ceil((baseLength / 2) - 1);
        this.visualRegion.start = Math.floor(centerPosition - aux);
        this.visualRegion.end = Math.floor(centerPosition + aux);

        this.positionMidPosDiv.textContent = Utils.formatNumber(centerPosition);
        this.positionLeftDiv.textContent = Utils.formatNumber(this.visualRegion.start);
        this.positionRightDiv.textContent = Utils.formatNumber(this.visualRegion.end);


        this.windowSize = `Window size: ${Utils.formatNumber(this.visualRegion.length())} nts`;
        this.windowSizeDiv.innerHTML = this.windowSize;
    }

    getTrackById(trackId) {
        if (typeof this.tracksIndex[trackId] !== "undefined") {
            let i = this.tracksIndex[trackId];
            return this.tracks[i];
        }
    }
    getSequenceTrack() {
        //if multiple, returns the first found
        for (let i = 0; i < this.tracks.length; i++) {
            let track = this.tracks[i];
            if (track.renderer instanceof SequenceRenderer) {
                return track;
            }
        }
        return;
    }

    getMousePosition(position) {
        let base = "";
        if (position > 0) {
            base = this.getSequenceNucleotid(position);
        }
        return base;
    }

    getSequenceNucleotid(position) {
        let seqTrack = this.getSequenceTrack();
        if (seqTrack) {
            let el = seqTrack.svgCanvasFeatures.querySelector(`text[data-pos="${position}"]`);
            if (el) {
                return el.textContent;
            }
        }
        return "";
    }

    setNucleotidPosition(position) {
        let base = this.getSequenceNucleotid(position);
        this.positionNucleotidDiv.style.color = SEQUENCE_COLORS[base];
        this.positionNucleotidDiv.textContent = base;
    }

    setCellBaseHost(host) {
        this.cellBaseHost = host;
        for (let i = 0; i < this.tracks.length; i++) {
            let track = this.tracks[i];
            if (track.dataAdapter instanceof CellBaseAdapter) {
                track.dataAdapter.setHost(this.cellBaseHost);
            }
        }
    }
    deleteTracksCache(){
        for (let i = 0; i < this.tracks.length; i++) {
            let track = this.tracks[i];
            if(track.dataAdapter.deleteCache != null){
                track.dataAdapter.deleteCache();
            }
        }
    }

}