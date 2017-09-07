
$(".shownotes").click(function(){
  var id = $(this).attr("data-id");
  var status = $("#notes" +id).attr("data-status");

  if(status === 'hidden'){
   
   $("#notes" +id).show();
   $("#notes" +id).attr("data-status","shown");
  }else{
    $("#notes" +id).hide();
    $("#notes" +id).attr("data-status", "hidden");

  }
})