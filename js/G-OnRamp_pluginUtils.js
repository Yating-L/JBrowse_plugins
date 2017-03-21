
function getProtein(input) {
    $.ajax({
        type: "POST",
        url: "./dnaToProt.py",
        data: {param: 'ATG'},
        success: function (response) {
            if(response)
                $('#output').html(response.value())
        }
    });
}