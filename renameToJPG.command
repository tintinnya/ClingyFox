echo "Current working directory where the script was executed: "$PWD
echo "How the script was invoked: "$0
target=$(dirname "$0")
echo "The folder where the script located when executed: "$target
cd "$target"
echo "Current Working directory has been changed to: "$PWD
echo "Renaming files to .jpg..."
ls | egrep '[0-9]{3}$' | awk '{ print "mv "$0" "$0".jpg" }' | sh
echo "Done. Please check the files."
