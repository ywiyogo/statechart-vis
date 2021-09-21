// Author: Yongkie Wiyogo
// Descr: Processing the data from JSON to visualize it as a state chart.
//        It is based on the vis.js https://visjs.github.io/vis-network/examples/

// create div element with these ids

function destroy() {
  if (network !== null) {
    network.destroy();
    network = null;
  }
}

function redrawAll(jsonData) {
  if (jsonData.nodes === undefined) {
    jsonData = gephiImported;
  } else {
    gephiImported = jsonData;
  }

  nodes.clear();
  edges.clear();

  var fixed = true;
  var parseColor = false;

  var parsed = vis.network.gephiParser.parseGephi(jsonData, {
    fixed: true,
  });
  // add the parsed data to the DataSets.
  nodes.add(jsonData.nodes);
  edges.add(jsonData.edges);

  network.fit(); // zoom to fit
}

function draw() {
  destroy();
  // nodes = [];
  // edges = [];

  // create a network
  var options = {
    layout: { randomSeed: seed }, // just to make sure the layout is the same when the locale is changed
    locale: document.getElementById("locale").value,
    manipulation: {
      addNode: function (data, callback) {
        // filling in the popup DOM elements
        document.getElementById("operation").innerHTML = "Add Node";
        document.getElementById("node-id").value = data.id;
        document.getElementById("node-label").value = data.label;
        document.getElementById("saveButton").onclick = saveData.bind(
          this,
          data,
          callback
        );
        document.getElementById("cancelButton").onclick = clearPopUp.bind();
        document.getElementById("network-popUp").style.display = "block";
      },
      editNode: function (data, callback) {
        // filling in the popup DOM elements
        document.getElementById("operation").innerHTML = "Edit Node";
        document.getElementById("node-id").value = data.id;
        document.getElementById("node-label").value = data.label;
        document.getElementById("saveButton").onclick = saveData.bind(
          this,
          data,
          callback
        );
        document.getElementById("cancelButton").onclick = cancelEdit.bind(
          this,
          callback
        );
        document.getElementById("network-popUp").style.display = "block";
      },
      addEdge: function (data, callback) {
        if (data.from == data.to) {
          var r = confirm("Do you want to connect the node to itself?");
          if (r == true) {
            callback(data);
          }
        } else {
          callback(data);
        }
      },
    },
  };
  network = new vis.Network(container, data, options);
  network.on("selectNode", function (params) {
    if (params.nodes.length == 1) {
      if (network.isCluster(params.nodes[0]) == true) {
        network.openCluster(params.nodes[0]);
      }
    }
  });
}

function clearPopUp() {
  document.getElementById("saveButton").onclick = null;
  document.getElementById("cancelButton").onclick = null;
  document.getElementById("network-popUp").style.display = "none";
}

function cancelEdit(callback) {
  clearPopUp();
  callback(null);
}

function saveData(data, callback) {
  data.id = document.getElementById("node-id").value;
  data.label = document.getElementById("node-label").value;
  clearPopUp();
  callback(data);
}

function clusterBySubstate() {
  network.setData(data);
  var substates = ["STANDBY", "CLEANING", "EXPLORING"];
  var clusterOptionsByData;
  for (var i = 0; i < substates.length; i++) {
    var substate = substates[i];
    clusterOptionsByData = {
      joinCondition: function (childOptions) {
        if (childOptions.attributes !== undefined) {
          return childOptions.attributes.substate == substate; // the color is fully defined in the node.
        }
      },
      processProperties: function (clusterOptions, childNodes, childEdges) {
        var totalMass = 0;
        for (var i = 0; i < childNodes.length; i++) {
          totalMass += childNodes[i].mass;
        }
        clusterOptions.mass = totalMass;
        return clusterOptions;
      },
      clusterNodeProperties: {
        id: "state:" + substate,
        borderWidth: 3,
        shape: "database",
        label: substate,
      },
    };
    network.cluster(clusterOptionsByData);
  }
}
