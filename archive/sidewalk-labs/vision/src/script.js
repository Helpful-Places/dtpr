var currentSection;
var currentAgent;
var showingPhone = false;
var scroller = scrollama();
var bgPositions = [
  [
    [385, 540],
    [1480, 540],
    [2550, 540],
    [3140, 540],
  ],
  [
    [4690, 540],
    [6000, 540],
    [6810, 540],
    [7850, 540],
  ],
  [
    [8760, 540],
    [9620, 540],
    [10820, 540],
    [11830, 540],
  ],
  [
    [12720, 540],
    [13760, 540],
    [14460, 540],
    [15880, 540],
  ],
  [
    [17030, 540],
    [17850, 540],
    [18800, 540],
    [19800, 540],
  ],
  [
    [21240, 540],
    [21940, 540],
    [23300, 540],
    [24460, 540],
  ],
  [
    [25360, 540],
    [26040, 540],
    [26800, 540],
    [27760, 540],
  ],
];
var assistantPositions = [
  // [715, 156, 42, 48],
  // [2341, 228, 42, 48],
  // [2949, 165, 42, 48],
  // [4420, 159, 25, 29],
  // [5449, 215, 41, 47],
  // [6343, 212, 42, 48],
  // [7816, 161, 55, 63],
  // [8732, 226, 52, 59],
  // [9182, 152, 113, 128],
  // [9673, 199, 79, 89],
  // [10950, 223, 93, 105],
  // [12842, 263, 37, 42],
  [13613, 125, 44, 50],
];
// var phonePositions = [
//   [[390], [1120], [1490], [1840]],
//   [[2567], [3071], [3614], [4577]],
//   [[4923], [6306], [6668], [7091]],
//   [[9929], [10483], [10853], [11230]],
//   [[11531], [12546], [13274], [13906]],
//   [[14186], [15264], [15815], [16868]],
//   [[17044], [17199], [18072], [18072]],
// ];
var phonePositions;
var prototypeCardIds = [
  ["scenario-1a", "scenario-1b", "scenario-1c", "scenario-1d"],

  ["scenario-2a", "scenario-2b", "scenario-2b", "scenario-2d"],

  ["scenario-3a", "scenario-3b", "scenario-3c", "scenario-3d"],

  ["scenario-4a", "scenario-4b", "scenario-4c", "scenario-4d"],

  ["scenario-5a", "scenario-5b", "scenario-5c", "scenario-5d"],

  ["scenario-6a", "scenario-6b", "scenario-6c", "scenario-6d"],

  ["scenario-7a", "scenario-7b", "scenario-7c", "scenario-7d"],
];

$(function () {
  phonePositions = [];
  var cardSection;
  var yOffset = 0;
  var lastId = "";
  $(prototypeCardIds).each(function (i, sectionIds) {
    sectionPositions = [];
    $(sectionIds).each(function (j, cardId) {
      t = $(`#pcard-${cardId}`).position().top;
      h = $(`#pcard-${cardId}`).height();
      // y = t + h;
      if (cardId != lastId) yOffset += h + 16;
      sectionPositions.push(yOffset);
      lastId = cardId;
    });
    phonePositions.push(sectionPositions);
  });

  scroller = scrollama();
  $(".prototype-loader .btn").click(function () {
    var loaderEl = $(this).parents(".prototype-loader");
    var parentEl = loaderEl.parents(".prototype");
    var containerEl = parentEl.find(".prototype-container");
    var iFrame = parentEl.find("iframe");
    containerEl.show();
    loaderEl.hide();

    iFrame.attr("src", iFrame.attr("data-src"));
  });

  $("[data-link]").click(function () {
    var id = $(this).data("link");
    scrollToSection($("#" + id));
    window.location.hash = id;
  });
  $(".btn-seemore").click(function () {
    $(this).parents(".taxonomy-container").css("height", "auto");
    $(this).parents(".taxonomy-seemore").hide();
  });

  $(".nav-open-menu").click(function () {
    $(".menu-overlay-container").show();
  });
  $(".menu-overlay-container").click(function () {
    $(".menu-overlay-container").hide();
  });
  $(".section-title").click(function () {
    scrollToSection($(this).parents(".step"));
  });
  $(".nav-prev-section").click(function () {
    scrollToSection($(currentSection).prev(".step"));
  });
  $(".nav-next-section").click(function () {
    scrollToSection($(currentSection).next(".step"));
  });
  $(".cards-principles .btn-circle").click(function () {
    var width = $($(".cards-principles .col-10")[0]).width();
    width += $($(".cards-principles .col-10")[1]).width();
    $(".cards-principles").animate({ scrollLeft: width }, 500);
  });
  $(".cards-projects .btn-circle").click(function () {
    var width = $($(".cards-projects .col-10")[0]).width();
    width += $($(".cards-projects .col-10")[1]).width();
    $(".cards-projects").animate({ scrollLeft: width }, 500);
  });
  currentAgent = $($(".ai-option.selected .avatar .material-icons")[0]).text();
  $(".ai-option").click(function () {
    $(".ai-option.selected").removeClass("selected");
    $(this).addClass("selected");
    currentAgent = $(this).find(".avatar .material-icons").text();
    var agentIcon = $(this).data("icon");
    $(".tapestry-assistant").attr("src", `images/assistant_${agentIcon}.svg`);
    if (agentIcon == "help") {
      window.open("https://me210829.typeform.com/to/cHglkn7x");
    }
  });

  $(".prototype-conversation .prototype-card").click(function () {
    var step = $(this).data("prototype-step");
    $(".prototype-modal").scrollTop(0);
    $(".prototype-modal .data-chain").hide();
    $("#datachain-" + step).show();
    $(".prototype-modal").css("transform", "translateX(-375px)");
  });
  $(".prototype-modal").click(function () {
    $(".prototype-modal .data-chain").hide();
    var index = $(currentSection).attr("data-stepIndex");
    var frame = $(currentSection).attr("data-stepFrame");
    $("#datachain-" + prototypeCardIds[index][frame]).show();
    $(".prototype-modal").css("transform", "translateX(0)");
  });
  // setup the instance, pass callback functions
  scroller
    .setup({
      step: ".step",
      offset: 1,
      // progress: true,
    })
    .onStepEnter((response) => {
      currentSection = response.element;
      var index = $(currentSection).attr("data-stepIndex");
      var frame = $(currentSection).attr("data-stepFrame");
      var el = $(currentSection);
      var x, y;

      if (index && frame) {
        var sideMargin = 0;
        x = bgPositions[index][frame][0];
        y = bgPositions[index][frame][1];
        $("#tapestry .banner").css({
          transition: "transform 0.5s",
          transform: "translate(-" + x + "px, -" + y + "px)",
        });

        // if (frame == 0) {
        //   $("#sticky-prototype").hide();
        //   $("#chat-client").show();
        //   $("#tapestry .banner").css({
        //     transition: "transform 0s",
        //     transform: "translate(-" + x + "px, -" + y + "px)",
        //   });
        // } else {
        //   $("#sticky-prototype").show();
        //   $("#chat-client").hide();
        //   $("#tapestry .banner").css({
        //     transition: "transform 0.5s",
        //     transform: "translate(-" + x + "px, -" + y + "px)",
        //   });
        // }

        $(".prototype-conversation .prototype-card").css("opacity", 0.5);
        $("#pcard-" + prototypeCardIds[index][frame]).css("opacity", 1);
        $(".prototype-conversation").css(
          "transform",
          "translate(0, -" + phonePositions[index][frame] + "px)"
        );
      } else {
        // $("#sticky-prototype").hide();
        // $("#chat-client").hide();
      }
    })
    .onStepExit((response) => {})
    .onStepProgress((response) => {});

  // setup resize event
  window.addEventListener("resize", scroller.resize);
  $(window).resize(function () {
    $(".prototype-content").mouseover(function () {
      var scale = Math.min(1, ($(window).height() - 150) / 812);
      $(this).css("transform", `scaleX(${scale}) scaleY(${scale})`);
    });
    $(".prototype-content").mouseout(function () {
      $(this).css("transform", `scaleX(.2) scaleY(.2)`);
    });
  });
  $(window).resize();
});

function scrollToSection(sectionElement) {
  scroller.disable();
  $("html, body").animate(
    {
      scrollTop: sectionElement.offset().top,
    },
    1000,
    function () {
      scroller.enable();
    }
  );
}
