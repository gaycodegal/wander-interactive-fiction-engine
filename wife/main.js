class Person {
    constructor(name) {
        this._name = name;
    }
    greet() {
        return "Hello, " + this._name;
    }
}

const person = new Person("Jon");
console.log("hm", person.greet());
//console.log("hi");
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi90ZXN0bGliL3BlcnNvbi5tanMiLCJtYWluLm1qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY2xhc3MgUGVyc29uIHtcbiAgICBjb25zdHJ1Y3RvcihuYW1lKSB7XG4gICAgICAgIHRoaXMuX25hbWUgPSBuYW1lO1xuICAgIH1cbiAgICBncmVldCgpIHtcbiAgICAgICAgcmV0dXJuIFwiSGVsbG8sIFwiICsgdGhpcy5fbmFtZTtcbiAgICB9XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2ljR1Z5YzI5dUxtcHpJaXdpYzI5MWNtTmxVbTl2ZENJNklpSXNJbk52ZFhKalpYTWlPbHNpTGk0dkxpNHZMaTR2TGk0dkxpNHZkSGx3WlhOamNtbHdkQzkwWlhOMGJHbGlMM0JsY25OdmJpNTBjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lRVUZCUVN4TlFVRk5MRTlCUVU4c1RVRkJUVHRKUVVkbUxGbEJRVmtzU1VGQldUdFJRVU53UWl4SlFVRkpMRU5CUVVNc1MwRkJTeXhIUVVGSExFbEJRVWtzUTBGQlF6dEpRVU4wUWl4RFFVRkRPMGxCUlVRc1MwRkJTenRSUVVORUxFOUJRVThzVTBGQlV5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNN1NVRkRiRU1zUTBGQlF6dERRVU5LSWl3aWMyOTFjbU5sYzBOdmJuUmxiblFpT2xzaVpYaHdiM0owSUdOc1lYTnpJRkJsY25OdmJpQjdYRzRnSUNBZ2NISnBkbUYwWlNCZmJtRnRaVG9nYzNSeWFXNW5PMXh1WEc0Z0lDQWdZMjl1YzNSeWRXTjBiM0lvYm1GdFpUb2djM1J5YVc1bktTQjdYRzRnSUNBZ0lDQWdJSFJvYVhNdVgyNWhiV1VnUFNCdVlXMWxPMXh1SUNBZ0lIMWNibHh1SUNBZ0lHZHlaV1YwS0NrNklITjBjbWx1WnlCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCY0lraGxiR3h2TENCY0lpQXJJSFJvYVhNdVgyNWhiV1U3SUZ4dUlDQWdJSDFjYm4waVhYMD0iLCJpbXBvcnQgeyBQZXJzb24gfSBmcm9tIFwiLi4vdGVzdGxpYi9wZXJzb25cIjtcbmNvbnN0IHBlcnNvbiA9IG5ldyBQZXJzb24oXCJKb25cIik7XG5jb25zb2xlLmxvZyhcImhtXCIsIHBlcnNvbi5ncmVldCgpKTtcbi8vY29uc29sZS5sb2coXCJoaVwiKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaWJXRnBiaTVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6SWpwYklpNHVMeTR1THk0dUx5NHVMeTR1TDNSNWNHVnpZM0pwY0hRdloyRnRaUzl0WVdsdUxuUnpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSkJRVUZCTEU5QlFVOHNSVUZCUlN4TlFVRk5MRVZCUVVVc1RVRkJUU3h0UWtGQmJVSXNRMEZCUXp0QlFVTXpReXhOUVVGTkxFMUJRVTBzUjBGQlZ5eEpRVUZKTEUxQlFVMHNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenRCUVVONlF5eFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hOUVVGTkxFTkJRVU1zUzBGQlN5eEZRVUZGTEVOQlFVTXNRMEZCUXp0QlFVTnNReXh2UWtGQmIwSWlMQ0p6YjNWeVkyVnpRMjl1ZEdWdWRDSTZXeUpwYlhCdmNuUWdleUJRWlhKemIyNGdmU0JtY205dElGd2lMaTR2ZEdWemRHeHBZaTl3WlhKemIyNWNJanRjYm1OdmJuTjBJSEJsY25OdmJqb2dVR1Z5YzI5dUlEMGdibVYzSUZCbGNuTnZiaWhjSWtwdmJsd2lLVHRjYm1OdmJuTnZiR1V1Ykc5bktGd2lhRzFjSWl3Z2NHVnljMjl1TG1keVpXVjBLQ2twTzF4dUx5OWpiMjV6YjJ4bExteHZaeWhjSW1ocFhDSXBPMXh1SWwxOSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBTyxNQUFNLE1BQU0sQ0FBQztBQUNwQixJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUU7QUFDdEIsUUFBUSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztBQUMxQixLQUFLO0FBQ0wsSUFBSSxLQUFLLEdBQUc7QUFDWixRQUFRLE9BQU8sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDdEMsS0FBSztBQUNMOztBQ05BLE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0FBQ2xDLG9CQUFvQiJ9
