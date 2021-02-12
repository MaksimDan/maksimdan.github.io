$("#raw-gen-button").click(async function(){
    console.log("Generating new predictions...");

    showButtonId("#generating-button");
    let predictions = await predict_model(5);
    addGeneratedNamesToUI(predictions);
    showButtonId("#generate-button");

    console.log("Finished generating new predictions...");
    console.log(predictions);
});

function addGeneratedNamesToUI(names) {
    const cList = $('#pokenames');
    cList.empty();
    $.each(names, function(i)
    {
        let li = $('<li/>')
            .addClass('list-group-item')
            .attr('role', 'menuitem')
            .appendTo(cList);
        let aaa = $('<a/>')
            .addClass('ui-all')
            .text(names[i])
            .appendTo(li);
    });
}

function showButtonId(id){
    console.log("Showing button for " + id);
    let ids = ['#generate-button', '#generating-button', '#loading-button'];
    if (!ids.includes(id)) {
        console.log(id + " not recognized.");
    } else {
        ids.forEach(elm => {
            if (elm !== id) {
                $(elm).hide();
            }
        });

        $(id).show();
    }
}
